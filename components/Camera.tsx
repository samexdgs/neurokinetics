"use client";
import { useHandTracker } from "@/hooks/useHandTracker";
import type { SessionFeatures } from "@/lib/store";
import styles from "./Camera.module.css";

interface Props { onDone: (f: SessionFeatures) => void; exercise: string; }

export default function Camera({ onDone, exercise }: Props) {
  const { videoRef, canvasRef, state, start, stop } = useHandTracker();
  const tracking = state.status === "tracking";
  const ready    = state.status === "ready";

  async function handleStop() {
    const f = await stop();
    if (f) onDone(f);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.videoWrap}>
        <video ref={videoRef} className={styles.video} autoPlay playsInline muted />
        <canvas ref={canvasRef} className={styles.canvas} />
        {state.status === "loading" && (
          <div className={styles.overlay}>
            <div className={styles.spin} />
            <span>{state.message}</span>
          </div>
        )}
      </div>

      <div className={styles.bar}>
        <span className={tracking ? styles.dotG : ready ? styles.dotB : styles.dotN} />
        <span className={styles.msg}>{state.message}</span>
        {tracking && <span className={styles.fc}>{state.frameCount} frames</span>}
      </div>

      {tracking && state.live && (
        <div className={styles.grid}>
          {[
            ["Index ROM", (state.live.romIndex ?? "—") + "°"],
            ["Smoothness", state.live.smoothness?.toFixed(2) ?? "—"],
            ["Confidence", state.live.confidence ? Math.round(state.live.confidence * 100) + "%" : "—"],
          ].map(([l, v]) => (
            <div key={l} className={styles.cell}>
              <span className={styles.cellL}>{l}</span>
              <span className={styles.cellV}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {ready && !tracking && (
        <div className={styles.setup}>
          <strong>Setup:</strong> Sit 40–60 cm from camera. Hand and forearm fully visible. Good front lighting.
          <br />Exercise: <strong>{exercise}</strong>
        </div>
      )}

      {state.status === "error" && <div className={styles.err}>{state.message}</div>}

      <div className={styles.btns}>
        {!tracking ? (
          <button className={styles.btnStart} onClick={start} disabled={!ready}>
            ▶ Start Session
          </button>
        ) : (
          <button className={styles.btnStop} onClick={handleStop}>
            ⏹ Stop & Save
          </button>
        )}
      </div>
    </div>
  );
}
