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

export default function SessionPage() {
  const router = useRouter();
  const [user, setUser]   = useState<any>(null);
  const [exIdx, setExIdx] = useState(0);
  const [result, setResult] = useState<SessionFeatures|null>(null);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    const uid = localStorage.getItem("nk_uid");
    if (!uid) { router.push("/login"); return; }
    const u = getUser(uid);
    if (!u)  { router.push("/login"); return; }
    setUser(u);
  }, []);

  if (!user) return null;
  const ex = EXERCISES[exIdx];

  function handleSave() {
    if (!result || saved) return;
    saveSession({
      id: uuidv4(), userId: user.username,
      date: new Date().toISOString().split("T")[0],
      timestamp: new Date().toISOString(),
      features: result,
      trendLabel: classifySession(result),
      fmaProxy: estimateFmaProxy(result),
      exerciseId: ex.id,
    });
    setSaved(true);
  }

  const label = result ? classifySession(result) : null;
  const fma   = result ? estimateFmaProxy(result) : null;

  return (
    <div className={styles.page}>
      <header className={styles.hdr}>
        <button className={styles.back} onClick={() => router.push("/dashboard")}>← Dashboard</button>
        <h1 className={styles.title}>Movement Session</h1>
      </header>

      <div className={styles.body}>
        <div className={styles.left}>
          <div className={styles.pills}>
            {EXERCISES.map((e,i) => (
              <button key={e.id}
                className={i===exIdx ? styles.pillOn : styles.pill}
                onClick={() => { setExIdx(i); setResult(null); setSaved(false); }}>
                {e.name}
              </button>
            ))}
          </div>
          <div className={styles.instBox}>
            <span className={styles.diff}>{ex.difficulty}</span>
            <p>{ex.instruction}</p>
            <p className={styles.measures}>Measures: {ex.measures}</p>
          </div>
          <Camera onDone={setResult} exercise={ex.name} />
        </div>

        <div className={styles.right}>
          {result ? (
            <div className={styles.results}>
              <div className={styles.trendCard} style={{
                background: label===2?"var(--green-light)":label===1?"var(--amber-light)":"var(--red-light)",
                borderColor: label===2?"var(--green-border)":label===1?"var(--amber-border)":"var(--red-border)",
              }}>
                <div className={styles.trendLbl} style={{color:TREND_COLORS[label!]}}>{TREND_LABELS[label!]}</div>
                <div className={styles.trendSub}>FMA-UE proxy: <strong>{fma}/66</strong> · Frames: {result.frameCount}</div>
              </div>

              <div className={styles.grid}>
                {[
                  ["Index ROM", result.romIndex+"°"],
                  ["Middle ROM", result.romMiddle+"°"],
                  ["Wrist ROM", result.wristFlexion+"°"],
                  ["Open speed", result.handOpenSpeed.toFixed(0)],
                  ["Smoothness", result.smoothness.toFixed(2)],
                  ["Tremor", result.tremorIndex.toFixed(2)],
                  ["Confidence", Math.round(result.confidence*100)+"%"],
                  ["Frames", String(result.frameCount)],
                ].map(([l,v]) => (
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
                : <div className={styles.savedMsg}>
                    ✓ Saved.{" "}
                    <button className={styles.lnk} onClick={()=>router.push("/dashboard")}>View progress →</button>
                  </div>
              }
            </div>
          ) : (
            <div className={styles.ph}>
              <p>Complete an exercise to see your analysis here.</p>
              <ul>
                <li>Range of motion for each finger</li>
                <li>Movement speed and smoothness</li>
                <li>Tremor index</li>
                <li>FMA-UE proxy score (0–66)</li>
                <li>Session trend classification</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
