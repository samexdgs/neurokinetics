"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { v4 as uuidv4 } from "uuid";
import { getUser, saveSession } from "@/lib/store";
import type { SessionFeatures } from "@/lib/store";
import { classifySession, estimateFmaProxy, EXERCISES, TREND_LABELS, TREND_COLORS } from "@/lib/analysis";
import styles from "./page.module.css";

const Camera = dynamic(() => import("@/components/Camera"), {
  ssr: false,
  loading: () => <div className={styles.loading}>Loading camera…</div>,
});

const EXERCISE_VIDEOS: Record<string, string> = {
  hand_open_close: "/videos/hand_open_close.mp4",
  wrist_rotation:  "/videos/hand_rotate.mp4",
  finger_tap:      "/videos/hand_tapping.mp4",
  reach_return:    "/videos/hand_reach.mp4",
};

const EXERCISE_CUES: Record<string, string[]> = {
  hand_open_close: ["Spread fingers as wide as possible","Hold fully open 2 seconds","Close into a gentle fist","Slow and controlled — 10 reps"],
  wrist_rotation:  ["Hold arm out, elbow slightly bent","Rotate wrist — palm faces up","Rotate back — palm faces down","10 reps each direction"],
  finger_tap:      ["Tap index finger to thumb","Then each finger in sequence","Keep your wrist still","Continue for 15 seconds"],
  reach_return:    ["Start with hand at your chest","Reach forward toward the camera","Hold extended for 2 seconds","Return slowly — 8 reps"],
};

export default function SessionPage() {
  const router = useRouter();
  const [user, setUser]     = useState<any>(null);
  const [exIdx, setExIdx]   = useState(0);
  const [result, setResult] = useState<SessionFeatures | null>(null);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    const uid = localStorage.getItem("nk_uid");
    if (!uid) { router.push("/login"); return; }
    const u = getUser(uid);
    if (!u)  { router.push("/login"); return; }
    setUser(u);
  }, []);

  if (!user) return null;

  const ex       = EXERCISES[exIdx];
  const videoSrc = EXERCISE_VIDEOS[ex.id];
  const cues     = EXERCISE_CUES[ex.id] ?? [];
  const label    = result ? classifySession(result) : null;
  const fma      = result ? estimateFmaProxy(result) : null;

  function handleSave() {
    if (!result || saved) return;
    saveSession({ id: uuidv4(), userId: user.username,
      date: new Date().toISOString().split("T")[0],
      timestamp: new Date().toISOString(),
      features: result, trendLabel: classifySession(result),
      fmaProxy: estimateFmaProxy(result), exerciseId: ex.id });
    setSaved(true);
  }

  return (
    <div className={styles.page}>
      <header className={styles.hdr}>
        <button className={styles.back} onClick={() => router.push("/dashboard")}>← Dashboard</button>
        <h1 className={styles.title}>Movement Session</h1>
      </header>

      <div className={styles.body}>
        <div className={styles.left}>
          <div className={styles.pills}>
            {EXERCISES.map((e, i) => (
              <button key={e.id}
                className={i === exIdx ? styles.pillOn : styles.pill}
                onClick={() => { setExIdx(i); setResult(null); setSaved(false); }}>
                {e.name}
              </button>
            ))}
          </div>

          {/* Demo video + instructions side by side */}
          <div className={styles.demoWrap}>
            <div className={styles.demoLeft}>
              <p className={styles.demoLabel}>Demonstration</p>
              <video key={videoSrc} className={styles.demoVideo} autoPlay loop muted playsInline>
                <source src={videoSrc} type="video/mp4" />
              </video>
            </div>
            <div className={styles.demoRight}>
              <p className={styles.demoLabel}>How to perform</p>
              <div className={styles.instBox}>
                <span className={styles.diff}>{ex.difficulty}</span>
                <p className={styles.instText}>{ex.instruction}</p>
                <p className={styles.measures}>Measures: {ex.measures}</p>
              </div>
              <div className={styles.cues}>
                {cues.map((c, i) => (
                  <div key={i} className={styles.cue}>
                    <span className={styles.cueNum}>{i + 1}</span>
                    <span className={styles.cueText}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className={styles.demoLabel} style={{ marginTop: "1rem" }}>Your camera</p>
          <Camera onDone={setResult} exercise={ex.name} />
        </div>

        <div className={styles.right}>
          {result ? (
            <div className={styles.results}>
              <div className={styles.trendCard} style={{
                background: label===2?"var(--green-light)":label===1?"var(--amber-light)":"var(--red-light)",
                borderColor: label===2?"var(--green-border)":label===1?"var(--amber-border)":"var(--red-border)",
              }}>
                <div className={styles.trendLbl} style={{ color: TREND_COLORS[label!] }}>
                  {TREND_LABELS[label!]}
                </div>
                <div className={styles.trendSub}>
                  FMA-UE proxy: <strong>{fma}/66</strong> · Frames: {result.frameCount}
                </div>
              </div>

              <div className={styles.grid}>
                {[
                  ["Index ROM", result.romIndex+"°"], ["Middle ROM", result.romMiddle+"°"],
                  ["Wrist ROM", result.wristFlexion+"°"], ["Open speed", result.handOpenSpeed.toFixed(0)],
                  ["Smoothness", result.smoothness.toFixed(2)], ["Tremor", result.tremorIndex.toFixed(2)],
                  ["Confidence", Math.round(result.confidence*100)+"%"], ["Frames", String(result.frameCount)],
                ].map(([l, v]) => (
                  <div key={l} className={styles.cell}>
                    <span className={styles.cl}>{l}</span>
                    <span className={styles.cv}>{v}</span>
                  </div>
                ))}
              </div>

              <p className={styles.disc}>
                FMA-UE proxy is estimated from camera kinematics, not direct force measurement.
                This is a monitoring aid, not a clinical assessment.
              </p>

              {!saved
                ? <button className={styles.saveBtn} onClick={handleSave}>Save session</button>
                : <div className={styles.savedMsg}>✓ Saved.{" "}
                    <button className={styles.lnk} onClick={() => router.push("/dashboard")}>View progress →</button>
                  </div>
              }
            </div>
          ) : (
            <div className={styles.ph}>
              <p className={styles.phTitle}>What you will see here</p>
              <ul>
                <li>Range of motion for each finger</li>
                <li>Movement speed and smoothness</li>
                <li>Tremor index</li>
                <li>FMA-UE proxy score (0–66)</li>
                <li>Session trend classification</li>
              </ul>
              <p className={styles.phNote}>
                Watch the demonstration video on the left, then click <strong>Start Session</strong> on the camera below.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
