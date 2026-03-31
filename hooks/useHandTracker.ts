"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { SessionFeatures } from "@/lib/store";

interface LiveMetrics { romIndex?: number; smoothness?: number; confidence?: number; }
interface State {
  status: "idle"|"loading"|"ready"|"tracking"|"error";
  message: string;
  live: LiveMetrics | null;
  frameCount: number;
}

export interface HandTrackerReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  state: State;
  start: () => void;
  stop: () => Promise<SessionFeatures | null>;
}

function angle(
  a:{x:number;y:number}, b:{x:number;y:number}, c:{x:number;y:number}
): number {
  const ab={x:a.x-b.x,y:a.y-b.y}, cb={x:c.x-b.x,y:c.y-b.y};
  const dot=ab.x*cb.x+ab.y*cb.y;
  const mag=Math.sqrt((ab.x**2+ab.y**2)*(cb.x**2+cb.y**2));
  if(mag<1e-6) return 0;
  return (Math.acos(Math.max(-1,Math.min(1,dot/mag)))*180)/Math.PI;
}

const MCP=[1,5,9,13,17], PIP=[2,6,10,14,18], DIP=[3,7,11,15,19];

export function useHandTracker(): HandTrackerReturn {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mpRef     = useRef<any>(null);
  const rafRef    = useRef<number>(0);
  const going     = useRef(false);

  const romBuf   = useRef<number[][]>([[],[],[],[],[]]);
  const wristBuf = useRef<number[]>([]);
  const spdBuf   = useRef<number[]>([]);
  const jerkBuf  = useRef<number[]>([]);
  const confBuf  = useRef<number[]>([]);
  const prevTip  = useRef<{x:number;y:number}|null>(null);
  const prevTs   = useRef<number>(0);
  const fCount   = useRef(0);

  const [state, setState] = useState<State>({
    status:"idle", message:"Initialising…", live:null, frameCount:0
  });

  const setS = useCallback((status:State["status"], message:string) => {
    setState(s => ({...s, status, message}));
  },[]);

  useEffect(() => {
    let dead = false;
    (async () => {
      setS("loading","Loading MediaPipe hand model…");
      try {
        const { FilesetResolver, HandLandmarker, DrawingUtils } =
          await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        const hl = await HandLandmarker.createFromOptions(vision, {
          baseOptions:{
            modelAssetPath:"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate:"CPU"
          },
          runningMode:"VIDEO", numHands:1,
          minHandDetectionConfidence:0.5, minTrackingConfidence:0.5
        });
        if(dead) return;
        mpRef.current = { hl, DrawingUtils };

        const stream = await navigator.mediaDevices.getUserMedia({
          video:{ width:640, height:480, facingMode:"user" }
        });
        if(dead){ stream.getTracks().forEach(t=>t.stop()); return; }
        if(videoRef.current){
          videoRef.current.srcObject = stream;
          await new Promise<void>(res=>{
            if(!videoRef.current) return res();
            videoRef.current.onloadedmetadata = ()=>res();
          });
        }
        setS("ready","Ready — click Start Session.");
      } catch(e:any){
        if(!dead) setS("error","Failed: "+e.message);
      }
    })();
    return () => {
      dead = true;
      cancelAnimationFrame(rafRef.current);
      const src = videoRef.current?.srcObject as MediaStream|null;
      src?.getTracks().forEach(t=>t.stop());
    };
  },[]);

  function reset() {
    romBuf.current=[[],[],[],[],[]]; wristBuf.current=[];
    spdBuf.current=[]; jerkBuf.current=[]; confBuf.current=[];
    prevTip.current=null; prevTs.current=0; fCount.current=0;
  }

  const frame = useCallback((ts:number) => {
    if(!going.current) return;
    rafRef.current = requestAnimationFrame(frame);
    const video=videoRef.current, canvas=canvasRef.current, mp=mpRef.current;
    if(!video||!canvas||!mp||!video.videoWidth) return;
    canvas.width=video.videoWidth; canvas.height=video.videoHeight;
    const ctx=canvas.getContext("2d"); if(!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const res=mp.hl.detectForVideo(video,ts);
    if(res.landmarks?.length>0){
      fCount.current++;
      const lm=res.landmarks[0];
      const du=new mp.DrawingUtils(ctx);
      const { HandLandmarker } = require("@mediapipe/tasks-vision");
      du.drawConnectors(lm,HandLandmarker.HAND_CONNECTIONS,{color:"#3b82f6",lineWidth:2});
      du.drawLandmarks(lm,{color:"#6366f1",radius:3});
      for(let i=0;i<5;i++)
        romBuf.current[i].push(angle(lm[MCP[i]],lm[PIP[i]],lm[DIP[i]]));
      wristBuf.current.push(angle(lm[0],lm[9],lm[5]));
      const tip=lm[8];
      if(prevTip.current && prevTs.current>0){
        const dt=(ts-prevTs.current)/1000;
        if(dt>0){
          const dx=(tip.x-prevTip.current.x)*canvas.width;
          const dy=(tip.y-prevTip.current.y)*canvas.height;
          const spd=Math.sqrt(dx*dx+dy*dy)/dt;
          spdBuf.current.push(spd);
          if(spdBuf.current.length>=2)
            jerkBuf.current.push(Math.abs(spd-(spdBuf.current.at(-2)??0))/dt);
        }
      }
      prevTip.current={x:tip.x,y:tip.y}; prevTs.current=ts;
      confBuf.current.push(0.9);
      const mean=(a:number[])=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
      const sm=jerkBuf.current.length>0
        ? Math.max(0,Math.min(1,1-mean(jerkBuf.current)/60)) : 0.5;
      setState(s=>({...s, frameCount:fCount.current,
        live:{romIndex:Math.round(mean(romBuf.current[1])),
               smoothness:Math.round(sm*100)/100,
               confidence:Math.round(mean(confBuf.current)*100)/100}}));
    }
  },[]);

  const start = useCallback(()=>{
    reset(); going.current=true;
    setS("tracking","Recording…");
    rafRef.current=requestAnimationFrame(frame);
  },[frame]);

  const stop = useCallback(async():Promise<SessionFeatures|null>=>{
    going.current=false;
    cancelAnimationFrame(rafRef.current);
    setS("ready","Processing…");
    if(fCount.current<30){
      setS("ready","Too few frames. Keep hand in view and try again.");
      return null;
    }
    const mean=(a:number[])=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
    const sm=jerkBuf.current.length>0
      ? Math.max(0,Math.min(1,1-mean(jerkBuf.current)/60)) : 0.5;
    const f:SessionFeatures={
      romIndex:   Math.round(mean(romBuf.current[1])*10)/10,
      romMiddle:  Math.round(mean(romBuf.current[2])*10)/10,
      romThumb:   Math.round(mean(romBuf.current[0])*10)/10,
      wristFlexion: Math.round(mean(wristBuf.current)*10)/10,
      handOpenSpeed: Math.round(Math.max(...(spdBuf.current.length?spdBuf.current:[0]))*10)/10,
      smoothness: Math.round(sm*1000)/1000,
      tremorIndex: Math.round(Math.max(0,Math.min(1,1-sm-0.1))*1000)/1000,
      confidence: Math.round(mean(confBuf.current)*100)/100,
      frameCount: fCount.current,
    };
    setS("ready","Session complete.");
    return f;
  },[]);

  return { videoRef, canvasRef, state, start, stop };
}
