import type { Session, SessionFeatures } from "./store";

export const TREND_LABELS = ["Declining","Stable","Improving"] as const;
export const TREND_COLORS = ["#dc2626","#d97706","#16a34a"] as const;

export function classifySession(f: SessionFeatures): 0|1|2 {
  const score = (f.romIndex/90)*30 + f.smoothness*25 +
    (f.handOpenSpeed/150)*20 + (1-f.tremorIndex)*15 + f.confidence*10;
  return score >= 55 ? 2 : score >= 35 ? 1 : 0;
}

export function estimateFmaProxy(f: SessionFeatures): number {
  const romMean = (f.romIndex + f.romMiddle + f.romThumb) / 3;
  const raw = (romMean/90)*22 + f.smoothness*14 +
    (f.handOpenSpeed/150)*12 + (f.wristFlexion/60)*10 + (1-f.tremorIndex)*8;
  return Math.round(Math.min(Math.max(raw,0),66)*10)/10;
}

export interface TrendResult {
  direction: 0|1|2; score: number;
  romDelta: number; smoothnessDelta: number; fmaDelta: number;
  sessionsAnalysed: number;
}
export function computeTrend(sessions: Session[]): TrendResult | null {
  if (sessions.length < 2) return null;
  const recent = sessions.slice(-7);
  const first = recent[0].features;
  const last  = recent[recent.length-1].features;
  const romDelta      = last.romIndex - first.romIndex;
  const smoothDelta   = last.smoothness - first.smoothness;
  const fmaDelta      = estimateFmaProxy(last) - estimateFmaProxy(first);
  let score = 50;
  score += Math.min(romDelta * 0.8, 20);
  score += Math.min(smoothDelta * 30, 15);
  score += Math.min(fmaDelta * 1.2, 15);
  score = Math.round(Math.min(Math.max(score,0),100));
  const direction: 0|1|2 = score>=58 ? 2 : score>=43 ? 1 : 0;
  return {
    direction, score,
    romDelta: Math.round(romDelta*10)/10,
    smoothnessDelta: Math.round(smoothDelta*100)/100,
    fmaDelta: Math.round(fmaDelta*10)/10,
    sessionsAnalysed: recent.length,
  };
}

export const EXERCISES = [
  { id:"hand_open_close", name:"Hand Open & Close",
    instruction:"Open your hand as wide as possible, hold 2 seconds, then close into a gentle fist. Repeat 10 times slowly.",
    measures:"Index ROM, smoothness, speed", difficulty:"Beginner", reps:10 },
  { id:"wrist_rotation", name:"Wrist Rotation",
    instruction:"Hold your arm out. Rotate your wrist — palm up then palm down. Slow and controlled. 10 reps each direction.",
    measures:"Wrist flexion, smoothness", difficulty:"Beginner", reps:10 },
  { id:"finger_tap", name:"Finger Tapping",
    instruction:"Tap your index finger to your thumb repeatedly for 15 seconds, then each finger in turn.",
    measures:"Speed, tremor, smoothness", difficulty:"Beginner", reps:null },
  { id:"reach_return", name:"Reach & Return",
    instruction:"Reach your hand toward the camera, hold 2 seconds, return. 8 repetitions.",
    measures:"Reach speed, path efficiency", difficulty:"Intermediate", reps:8 },
];
