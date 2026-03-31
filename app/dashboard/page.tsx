"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { getUser, getSessions } from "@/lib/store";
import type { Session } from "@/lib/store";
import { computeTrend, estimateFmaProxy, TREND_LABELS, TREND_COLORS, EXERCISES } from "@/lib/analysis";
import styles from "./page.module.css";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser]       = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const uid = localStorage.getItem("nk_uid");
    if (!uid) { router.push("/login"); return; }
    const u = getUser(uid);
    if (!u)  { router.push("/login"); return; }
    setUser(u);
    setSessions(getSessions(uid));
  }, []);

  if (!user) return null;

  const trend      = computeTrend(sessions);
  const fmaLatest  = sessions.length ? estimateFmaProxy(sessions.at(-1)!.features) : 0;
  const fmaFirst   = sessions.length ? estimateFmaProxy(sessions[0].features) : 0;
  const fmaDelta   = Math.round((fmaLatest-fmaFirst)*10)/10;
  const improving  = sessions.filter(s=>s.trendLabel===2).length;

  const chartData = sessions.slice(-14).map(s=>({
    date: s.date.slice(5),
    fma:  estimateFmaProxy(s.features),
    rom:  s.features.romIndex,
    sm:   Math.round(s.features.smoothness*100),
  }));

  const weekSessions = sessions.filter(s=>{
    const d=new Date(s.date), n=new Date();
    return (n.getTime()-d.getTime())/86400000 < 7;
  }).length;

  function logout() { localStorage.removeItem("nk_uid"); router.push("/login"); }

  return (
    <div className={styles.page}>
      <header className={styles.hdr}>
        <div className={styles.hLeft}>
          <span className={styles.logo}>✋</span>
          <div>
            <div className={styles.name}>{user.fullName}</div>
            <div className={styles.meta}>Day {user.daysPostStroke} post-stroke · {user.affectedSide} side affected</div>
          </div>
        </div>
        <div className={styles.hRight}>
          <button className={styles.newBtn} onClick={()=>router.push("/session")}>+ New session</button>
          <button className={styles.outBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className={styles.main}>
        {sessions.length === 0 ? (
          <div className={styles.empty}>
            <p>No sessions yet.</p>
            <p>Click <button className={styles.lnk} onClick={()=>router.push("/session")}>+ New session</button> to begin tracking your recovery.</p>
          </div>
        ) : (<>
          {trend && (
            <div className={styles.banner} style={{
              background: trend.direction===2?"var(--green-light)":trend.direction===1?"var(--amber-light)":"var(--red-light)",
              borderColor: trend.direction===2?"var(--green-border)":trend.direction===1?"var(--amber-border)":"var(--red-border)",
            }}>
              <span className={styles.bannerTxt} style={{color:TREND_COLORS[trend.direction]}}>{TREND_LABELS[trend.direction]}</span>
              <span className={styles.bannerSub}>
                Score: {trend.score}/100 · {trend.sessionsAnalysed} sessions ·
                ROM Δ{trend.romDelta>0?"+":""}{trend.romDelta}° · FMA Δ{trend.fmaDelta>0?"+":""}{trend.fmaDelta}
              </span>
            </div>
          )}

          <div className={styles.stats}>
            {[
              ["Sessions",sessions.length],
              ["FMA proxy",`${fmaLatest}/66`],
              ["FMA change",`${fmaDelta>=0?"+":""}${fmaDelta}`],
              ["Improving",improving],
            ].map(([l,v])=>(
              <div key={l as string} className={styles.stat}>
                <div className={styles.statL}>{l}</div>
                <div className={styles.statV}>{v}</div>
              </div>
            ))}
          </div>

          <div className={styles.charts}>
            <div className={styles.chart}>
              <div className={styles.chartT}>FMA-UE proxy score (0–66)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{fontSize:11}} tickLine={false} />
                  <YAxis domain={[0,70]} tick={{fontSize:11}} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <ReferenceLine y={33} stroke="#d97706" strokeDasharray="4 4" label={{value:"Moderate",fontSize:10}} />
                  <Line type="monotone" dataKey="fma" stroke="#2563eb" strokeWidth={2} dot={{r:4,fill:"#2563eb"}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chart}>
              <div className={styles.chartT}>Index ROM (°) and smoothness (%)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{fontSize:11}} tickLine={false} />
                  <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="rom" stroke="#16a34a" strokeWidth={2} dot={{r:3,fill:"#16a34a"}} name="ROM" />
                  <Line type="monotone" dataKey="sm"  stroke="#7c3aed" strokeWidth={2} dot={{r:3,fill:"#7c3aed"}} name="Smooth%" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.tableBox}>
            <div className={styles.sTitle}>Recent sessions</div>
            <div className={styles.thead}>
              <span>Date</span><span>Exercise</span><span>FMA</span>
              <span>ROM</span><span>Smooth</span><span>Status</span>
            </div>
            {sessions.slice(-10).reverse().map(s=>{
              const ex=EXERCISES.find(e=>e.id===s.exerciseId);
              return (
                <div key={s.id} className={styles.trow}>
                  <span>{s.date}</span>
                  <span>{ex?.name??"—"}</span>
                  <span>{estimateFmaProxy(s.features)}/66</span>
                  <span>{s.features.romIndex}°</span>
                  <span>{s.features.smoothness.toFixed(2)}</span>
                  <span style={{color:TREND_COLORS[s.trendLabel],fontWeight:500}}>{TREND_LABELS[s.trendLabel]}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.reportBox}>
            <div className={styles.sTitle}>Weekly report preview</div>
            <div className={styles.report}>
              <div className={styles.rHdr}>
                NeuroKinetics — Weekly Motor Recovery Report
                <span className={styles.rDate}>{new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</span>
              </div>
              <div className={styles.rBody}>
                {[
                  ["Patient", user.fullName],
                  ["Sessions this week", weekSessions],
                  ["FMA-UE proxy (latest)", `${fmaLatest}/66`],
                  ["Overall trajectory", TREND_LABELS[trend?.direction??1]],
                ].map(([l,v])=>(
                  <div key={l as string} className={styles.rRow}>
                    <span>{l}</span>
                    <strong style={l==="Overall trajectory"?{color:TREND_COLORS[trend?.direction??1]}:{}}>{v}</strong>
                  </div>
                ))}
              </div>
              <p className={styles.rNote}>
                Sent automatically every Friday to {user.physioEmail||"your physiotherapist"}.
              </p>
            </div>
          </div>

          <div className={styles.research}>
            <strong>Research basis</strong> — Kinematic features extracted via MediaPipe Hand Landmarker,
            validated for ROM measurement by Pourahmadi et al. (JMIR 2023). FMA-UE proxy estimated
            from kinematics following Lin et al. (ICORR 2021). Longitudinal trend classification addresses
            the gap identified by Khan et al. (IEEE Access 2024): no prior study applies temporal ML to
            home-based kinematic sessions.
          </div>
        </>)}
      </main>
    </div>
  );
}
