export interface User {
  id: string; username: string; fullName: string;
  daysPostStroke: number; affectedSide: string;
  physioEmail: string; createdAt: string;
}
export interface SessionFeatures {
  romIndex: number; romMiddle: number; romThumb: number;
  wristFlexion: number; handOpenSpeed: number;
  smoothness: number; tremorIndex: number;
  confidence: number; frameCount: number;
}
export interface Session {
  id: string; userId: string; date: string; timestamp: string;
  features: SessionFeatures; trendLabel: 0 | 1 | 2;
  fmaProxy: number; exerciseId: string;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function write(key: string, v: unknown) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(v));
}

export function getUser(u: string): User | null {
  return read<Record<string,User>>("nk_users", {})[u.toLowerCase()] ?? null;
}
export function saveUser(u: User) {
  const all = read<Record<string,User>>("nk_users", {});
  all[u.username.toLowerCase()] = u;
  write("nk_users", all);
}
export function getSessions(uid: string): Session[] {
  return (read<Record<string,Session[]>>("nk_sessions", {})[uid] ?? [])
    .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
export function saveSession(s: Session) {
  const all = read<Record<string,Session[]>>("nk_sessions", {});
  if (!all[s.userId]) all[s.userId] = [];
  all[s.userId].push(s);
  write("nk_sessions", all);
}
