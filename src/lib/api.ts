import { SERVER, SEED_USERS, SEED_TEAMS } from "./constants";
const fetchWithTimeout = (url: string, opts: RequestInit = {}, ms = 12000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(id));
};
const apiGet = async <T>(path: string): Promise<T | null> => {
  try { const r = await fetchWithTimeout(`${SERVER}/${path}`); return r.json(); } catch { return null; }
};
const apiPost = async (path: string, body: unknown) => {
  try { await fetchWithTimeout(`${SERVER}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); } catch(e) { console.error(e); }
};
export const getUsers = async () => {
  const arr = await apiGet<{id:string}[]>("users");
  if (arr && arr.length > 0) return Object.fromEntries(arr.map(u => [u.id, u])) as typeof SEED_USERS;
  return SEED_USERS;
};
export const saveUsers = async (u: typeof SEED_USERS) => apiPost("users/bulk", Object.values(u));
export const getTeams = async () => {
  const arr = await apiGet<{id:string}[]>("teams");
  if (arr && arr.length > 0) return Object.fromEntries(arr.map(t => [t.id, t])) as typeof SEED_TEAMS;
  return SEED_TEAMS;
};
export const getReports = async () => (await apiGet<unknown[]>("reports")) ?? [];
export const addReport = async (r: unknown) => apiPost("reports", r);
export const getDailyLogs = async () => (await apiGet<unknown[]>("logs")) ?? [];
export const saveDailyLog = async (log: unknown) => apiPost("logs", log);
export const getNoAnswers = async () => (await apiGet<unknown[]>("noanswers")) ?? [];
export const addNoAnswer = async (r: unknown) => apiPost("noanswers", r);
export const getGoals = async () => (await apiGet<unknown[]>("goals")) ?? [];
export const saveGoal = async (g: unknown) => apiPost("goals", g);
export const seedIfEmpty = async () => {
  const users = await apiGet<unknown[]>("users");
  if (!users || users.length === 0) { await apiPost("users/bulk", Object.values(SEED_USERS)); await apiPost("teams/bulk", Object.values(SEED_TEAMS)); }
};
export const transcribeAudio = async (audioFile: File) => {
  const formData = new FormData();
  formData.append("audio", audioFile, audioFile.name);
  const r = await fetch("/api/transcribe", { method: "POST", body: formData });
  if (!r.ok) throw new Error((await r.json()).error ?? "Transcription failed");
  const data = await r.json();
  if (!data.transcript) throw new Error("No transcript returned");
  return data.transcript as string;
};
export const analyzeWithClaude = async (payload: Record<string, string>) => {
  const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!r.ok) throw new Error((await r.json()).error ?? "Analysis failed");
  const data = await r.json();
  if (!data.analysis) throw new Error("No analysis returned");
  return data.analysis;
};
