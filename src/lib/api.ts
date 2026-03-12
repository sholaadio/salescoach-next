import { supabase } from "./supabase";
import { SEED_USERS, SEED_TEAMS } from "./constants";

export const getUsers = async () => {
  const { data } = await supabase.from("users").select("*");
  if (data && data.length > 0) return Object.fromEntries(data.map((u: any) => [u.id, u]));
  return SEED_USERS as any;
};
export const saveUsers = async (users: any) => {
  const rows = Object.values(users);
  await supabase.from("users").upsert(rows as any[]);
};
export const getTeams = async () => {
  const { data } = await supabase.from("teams").select("*");
  if (data && data.length > 0) return Object.fromEntries(data.map((t: any) => [t.id, t]));
  return SEED_TEAMS as any;
};
export const getReports = async () => {
  const { data } = await supabase.from("reports").select("*");
  return (data ?? []).map((r: any) => r.data ?? r);
};
export const addReport = async (r: any) => {
  await supabase.from("reports").upsert({ id: r.id, data: r });
};
export const getDailyLogs = async () => {
  const { data } = await supabase.from("logs").select("*");
  return (data ?? []).map((r: any) => r.data ?? r);
};
export const saveDailyLog = async (log: any) => {
  await supabase.from("logs").upsert({ id: log.id, data: log });
};
export const getNoAnswers = async () => {
  const { data } = await supabase.from("noanswers").select("*");
  return (data ?? []).map((r: any) => r.data ?? r);
};
export const addNoAnswer = async (r: any) => {
  await supabase.from("noanswers").upsert({ id: r.id, data: r });
};
export const getGoals = async () => {
  const { data } = await supabase.from("goals").select("*");
  return (data ?? []).map((r: any) => r.data ?? r);
};
export const saveGoal = async (g: any) => {
  await supabase.from("goals").upsert({ id: g.id, data: g });
};
export const seedIfEmpty = async () => {
  const { data } = await supabase.from("users").select("id").limit(1);
  if (!data || data.length === 0) {
    await supabase.from("users").upsert(Object.values(SEED_USERS));
    await supabase.from("teams").upsert(Object.values(SEED_TEAMS));
  }
};
export const transcribeAudio = async (audioFile: File) => {
  const formData = new FormData();
  formData.append("audio", audioFile, audioFile.name);
  const r = await fetch("/api/transcribe", { method: "POST", body: formData });
  if (!r.ok) throw new Error("Transcription failed");
  const data = await r.json();
  return data.transcript as string;
};
export const analyzeWithClaude = async (payload: Record<string, string>) => {
  const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!r.ok) throw new Error("Analysis failed");
  const data = await r.json();
  return data.analysis;
};
