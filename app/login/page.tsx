"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, saveUser } from "@/lib/store";
import styles from "./page.module.css";

export default function Login() {
  const router = useRouter();
  const [tab, setTab]     = useState<"in"|"up">("in");
  const [user, setUser]   = useState("");
  const [pass, setPass]   = useState("");
  const [name, setName]   = useState("");
  const [days, setDays]   = useState(90);
  const [side, setSide]   = useState("Left");
  const [email, setEmail] = useState("");
  const [err, setErr]     = useState("");

  function login(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const u = getUser(user.trim().toLowerCase());
    if (!u) return setErr("Username not found.");
    if (u.id !== btoa(user.toLowerCase()+":"+pass)) return setErr("Wrong password.");
    localStorage.setItem("nk_uid", u.username);
    router.push("/dashboard");
  }

  function register(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const key = user.trim().toLowerCase();
    if (!key || !pass || !name) return setErr("Name, username and password are required.");
    if (getUser(key)) return setErr("Username already taken.");
    saveUser({ id:btoa(key+":"+pass), username:key, fullName:name.trim(),
      daysPostStroke:days, affectedSide:side, physioEmail:email.trim(),
      createdAt:new Date().toISOString() });
    localStorage.setItem("nk_uid", key);
    router.push("/dashboard");
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.top}>
          <span className={styles.icon}>✋</span>
          <h1 className={styles.title}>NeuroKinetics</h1>
          <p className={styles.sub}>Camera-assisted motor recovery monitor for stroke survivors</p>
        </div>

        <div className={styles.tabs}>
          <button className={tab==="in"?styles.tabOn:styles.tab} onClick={()=>{setTab("in");setErr("");}}>Sign in</button>
          <button className={tab==="up"?styles.tabOn:styles.tab} onClick={()=>{setTab("up");setErr("");}}>Create account</button>
        </div>

        {tab==="in" ? (
          <form onSubmit={login} className={styles.form}>
            <label className={styles.label}>Username
              <input className={styles.input} value={user} onChange={e=>setUser(e.target.value)} placeholder="your username" autoComplete="username" />
            </label>
            <label className={styles.label}>Password
              <input className={styles.input} type="password" value={pass} onChange={e=>setPass(e.target.value)} autoComplete="current-password" />
            </label>
            {err && <p className={styles.err}>{err}</p>}
            <button type="submit" className={styles.btn}>Sign in</button>
          </form>
        ) : (
          <form onSubmit={register} className={styles.form}>
            <label className={styles.label}>Full name *
              <input className={styles.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Grace Adeyemi" />
            </label>
            <label className={styles.label}>Username *
              <input className={styles.input} value={user} onChange={e=>setUser(e.target.value)} placeholder="grace_adeyemi" />
            </label>
            <label className={styles.label}>Password *
              <input className={styles.input} type="password" value={pass} onChange={e=>setPass(e.target.value)} />
            </label>
            <div className={styles.row}>
              <label className={styles.label} style={{flex:1}}>Days since stroke
                <input className={styles.input} type="number" min={0} max={2000} value={days} onChange={e=>setDays(Number(e.target.value))} />
              </label>
              <label className={styles.label} style={{flex:1}}>Affected side
                <select className={styles.input} value={side} onChange={e=>setSide(e.target.value)}>
                  <option>Left</option><option>Right</option><option>Both</option>
                </select>
              </label>
            </div>
            <label className={styles.label}>Physiotherapist email
              <input className={styles.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="physio@hospital.com" />
            </label>
            {err && <p className={styles.err}>{err}</p>}
            <button type="submit" className={styles.btn}>Create account</button>
          </form>
        )}

        <p className={styles.note}>
          Video is processed entirely in your browser. No video is sent anywhere.
          Only kinematic scores are stored on your device.
          Built by Samuel Oluwakoya — research tool, not a medical device.
        </p>
      </div>
    </div>
  );
}
