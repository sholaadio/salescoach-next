import { supabase } from "./supabase";
import { SEED_USERS, SEED_TEAMS } from "./constants";
import type {
  UserMap, TeamMap, CallReport, DailyLog,
  NoAnswerRecord, Goal,
} from "@/types";

export const getUsers = async (): Promise<UserMap> => {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error || !data || data.length === 0) return SEED_USERS;
    return Object.fromEntries(data.map((u: any) => [u.id, u])) as UserMap;
  } catch { return SEED_USERS; }
};

export const saveUsers = async (u: UserMap): Promise<void> => {
  try { await supabase.from("users").upsert(Object.values(u)); }
  catch (e) { console.error("saveUsers", e); }
};

export const getTeams = async (): Promise<TeamMap> => {
  try {
    const { data, error } = await supabase.from("teams").select("*");
    if (error || !data || data.length === 0) return SEED_TEAMS;
    return Object.fromEntries(data.map((t: any) => [t.id, t])) as TeamMap;
  } catch { return SEED_TEAMS; }
};

export const saveTeams = async (t: TeamMap): Promise<void> => {
  try { await supabase.from("teams").upsert(Object.values(t)); }
  catch (e) { console.error("saveTeams", e); }
};

export const getReports = async (): Promise<CallReport[]> => {
  try {
    const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    return error ? [] : (data ?? []) as CallReport[];
  } catch { return []; }
};

export const addReport = async (r: CallReport): Promise<void> => {
  try { await supabase.from("reports").insert(r); }
  catch (e) { console.error("addReport", e); }
};

export const getDailyLogs = async (): Promise<DailyLog[]> => {
  try {
    const { data, error } = await supabase.from("logs").select("*").order("created_at", { ascending: false });
    return error ? [] : (data ?? []) as DailyLog[];
  } catch { return []; }
};

export const saveDailyLog = async (log: DailyLog): Promise<void> => {
  try { await supabase.from("logs").upsert(log); }
  catch (e) { console.error("saveDailyLog", e); }
};

export const getNoAnswers = async (): Promise<NoAnswerRecord[]> => {
  try {
    const { data, error } = await supabase.from("noanswers").select("*").order("created_at", { ascending: false });
    return error ? [] : (data ?? []) as NoAnswerRecord[];
  } catch { return []; }
};

export const addNoAnswer = async (r: NoAnswerRecord): Promise<void> => {
  try { await supabase.from("noanswers").insert(r); }
  catch (e) { console.error("addNoAnswer", e); }
};

export const getGoals = async (): Promise<Goal[]> => {
  try {
    const { data, error } = await supabase.from("goals").select("*");
    return error ? [] : (data ?? []) as Goal[];
  } catch { return []; }
};

export const saveGoal = async (g: Goal): Promise<void> => {
  try { await supabase.from("goals").upsert(g); }
  catch (e) { console.error("saveGoal", e); }
};

export const seedIfEmpty = async (): Promise<void> => {
  try {
    const { data } = await supabase.from("users").select("id").limit(1);
    if (!data || data.length === 0) {
      await supabase.from("users").upsert(Object.values(SEED_USERS));
      await supabase.from("teams").upsert(Object.values(SEED_TEAMS));
    }
  } catch (e) { console.error("seed error:", e); }
};

export const transcribeAudio = async (audioFile: File): Promise<string> => {
  const formData = new FormData();
  formData.append("audio", audioFile, audioFile.name);
  const r = await fetch("/api/transcribe", { method: "POST", body: formData });
  if (!r.ok) {
    const err = await r.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? "Transcription failed.");
  }
  const data = await r.json() as { transcript?: string };
  if (!data.transcript) throw new Error("No transcript returned.");
  return data.transcript;
};

export const analyzeWithClaude = async (payload: {
  transcript: string; closerName: string; callType: string;
  callOutcome: string; product: string; teamType: string;
}): Promise<Record<string, unknown>> => {
  const r = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? "Analysis failed.");
  }
  const data = await r.json() as { analysis?: Record<string, unknown> };
  if (!data.analysis) throw new Error("No analysis returned.");
  return data.analysis;
};
