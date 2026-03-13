"use client";
/* eslint-disable */
import React, { useState } from "react";
import { saveDailyLog, saveUsers as saveUsersApi } from "@/lib/api";
import type { User, UserMap, TeamMap, CallReport, DailyLog, NoAnswerRecord, Goal } from "@/types";

const uid = () => Math.random().toString(36).slice(2, 9);
const scoreColor = (s: number) => s >= 80 ? "#F97316" : s >= 60 ? "#FFB627" : "#FF6B6B";
const tierColor = (t: string) => ({ gold: "#FFB627", silver: "#9CA3AF", bronze: "#CD7C2F", none: "#5A6A80", flat: "#60A5FA" } as any)[t] || "#5A6A80";
const fmtDate = (d: any) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
const fmtNaira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;
const todayStr = () => new Date().toISOString().slice(0, 10);
const outcomeColor = (o: string) => ({ confirmed: "#F97316", cancelled: "#FF6B6B", followup: "#FFB627", switchedoff: "#5A6A80", callback: "#A78BFA", unknown: "#5A6A80" } as any)[o] || "#5A6A80";
const outcomeLabel = (o: string) => ({ confirmed: "✅ Confirmed", cancelled: "❌ Cancelled", followup: "🔄 Follow-up", switchedoff: "📵 Switched Off", callback: "⏰ Call Back", unknown: "🤷 Unknown" } as any)[o] || "Unknown";
const teamTypeIcon = (t: string) => ({ sales: "💼", followup: "🔄", socialmedia: "📱" } as any)[t] || "💼";
const ROLE_LABELS: any = { ceo: "CEO", gm: "General Manager", head_sales: "Head of Sales", head_creative: "Head of Creative", hr: "HR Manager", teamlead: "Team Lead", closer: "Sales Closer" };
const DARK: any = { bg: "#07080F", card: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)", text: "#F1F5FF", soft: "#C8D3E8", muted: "#6A7A90", green: "#00E5A0", yellow: "#FBBF24", red: "#FF6B6B", orange: "#F97316", navBg: "rgba(6,10,18,0.97)", surface: "rgba(255,255,255,0.03)", blue: "#60A5FA", purple: "#A78BFA", pink: "#F472B6" };
const LIGHT: any = { bg: "#F0F4FF", card: "rgba(255,255,255,0.9)", border: "rgba(0,0,0,0.08)", text: "#0A0E1A", soft: "#1E293B", muted: "#64748B", green: "#059669", yellow: "#D97706", red: "#DC2626", orange: "#EA580C", navBg: "rgba(255,255,255,0.97)", surface: "rgba(0,0,0,0.02)", blue: "#2563EB", purple: "#7C3AED", pink: "#DB2777" };
const C = () => { try { return typeof localStorage !== "undefined" && localStorage.getItem("sc_theme") === "light" ? LIGHT : DARK; } catch { return DARK; } };

function filterByPeriod(items: any[], field: string, period: string) {
  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
  return items.filter(i => { const d = new Date(i[field]); if (period === "today") return i[field] === todayStr(); if (period === "week") { const s = new Date(now); s.setDate(now.getDate() - 6); return d >= s; } if (period === "month") return d.getFullYear() === y && d.getMonth() === m; if (period === "year") return d.getFullYear() === y; return true; });
}
function getPerms(user: User) {
  const r = user.role;
  return {
    viewReports: true, viewCommission: true, approveLogs: ["teamlead","ceo","gm","head_sales"].includes(r),
    manageUsers: ["ceo","gm","head_sales","hr"].includes(r), generateSummary: ["ceo","gm","head_sales"].includes(r),
    viewLeaderboard: true, uploadCalls: true, logSales: ["closer","teamlead"].includes(r),
    viewAllTeams: ["ceo","gm","head_sales","head_creative","hr"].includes(r),
    resetPins: ["ceo","gm","head_sales","hr"].includes(r), manageRoles: ["ceo","gm"].includes(r),
  };
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => { try { return typeof localStorage !== "undefined" && localStorage.getItem("sc_theme") !== "light"; } catch { return true; } });
  const toggle = () => { const n = !isDark; setIsDark(n); try { localStorage.setItem("sc_theme", n ? "dark" : "light"); window.location.reload(); } catch {} };
  return <button onClick={toggle} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "4px 10px", color: "#6A7A90", cursor: "pointer", fontSize: 14 }}>{isDark ? "☀️" : "🌙"}</button>;
}
function PeriodFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = C(); return <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>{[["today", "Today"], ["week", "Week"], ["month", "Month"], ["year", "Year"], ["all", "All Time"]].map(([v, l]) => <button key={v} onClick={() => onChange(v)} style={{ background: value === v ? "rgba(249,115,22,0.15)" : t.card, color: value === v ? "#F97316" : t.muted, border: `1px solid ${value === v ? "rgba(249,115,22,0.35)" : t.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: value === v ? 700 : 500, cursor: "pointer" }}>{l}</button>)}</div>;
}
function ReportModal({ report, onClose }: { report: any; onClose: () => void }) {
  const t = C(); const a = report.analysis || {};
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
    <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, maxWidth: 600, width: "100%", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
        <div><div style={{ fontSize: 16, fontWeight: 800 }}>{report.product || "General"} · {report.callType === "whatsapp" ? "💬" : "📞"}</div><div style={{ fontSize: 12, color: t.muted }}>{fmtDate(report.date)} · {report.closerName}</div></div>
        <button onClick={onClose} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: "4px 12px", color: t.muted, cursor: "pointer" }}>✕</button>
      </div>
      {a.overallScore && <div style={{ fontSize: 36, fontWeight: 900, color: scoreColor(a.overallScore), marginBottom: 12 }}>{a.overallScore}<span style={{ fontSize: 14, color: t.muted }}>/100</span></div>}
      {a.verdict && <div style={{ fontSize: 13, color: t.soft, marginBottom: 16, lineHeight: 1.6 }}>{a.verdict}</div>}
      {a.strengths?.length > 0 && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 700, color: t.green, marginBottom: 6 }}>✅ Strengths</div>{a.strengths.map((s: string, i: number) => <div key={i} style={{ fontSize: 12, color: t.soft, marginBottom: 4, paddingLeft: 12 }}>· {s}</div>)}</div>}
      {a.weaknesses?.length > 0 && <div><div style={{ fontSize: 12, fontWeight: 700, color: t.red, marginBottom: 6 }}>⚠️ Weaknesses</div>{a.weaknesses.map((s: string, i: number) => <div key={i} style={{ fontSize: 12, color: t.soft, marginBottom: 4, paddingLeft: 12 }}>· {s}</div>)}</div>}
    </div>
  </div>;
}
function ChangePinModal({ user, onClose, saveUsersData, refresh, allUsers }: any) {
  const t = C(); const [cur, setCur] = useState(""); const [np, setNp] = useState(""); const [cp, setCp] = useState(""); const [err, setErr] = useState(""); const [ok, setOk] = useState(false);
  const save = async () => { if (cur !== user.pin) { setErr("Current PIN incorrect."); return; } if (np.length !== 4) { setErr("Must be 4 digits."); return; } if (np !== cp) { setErr("PINs don't match."); return; } await saveUsersData({ ...allUsers, [user.id]: { ...user, pin: np } }); await refresh(); setOk(true); setTimeout(onClose, 1200); };
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
    <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, width: 320 }} onClick={e => e.stopPropagation()}>
      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 18 }}>🔒 Change PIN</div>
      {ok ? <div style={{ color: t.green, textAlign: "center", padding: 20 }}>✅ PIN updated!</div> : <>
        {[["Current PIN", cur, setCur], ["New PIN", np, setNp], ["Confirm PIN", cp, setCp]].map(([l, v, s]: any) => <div key={l} style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: t.muted, display: "block", marginBottom: 4 }}>{l}</label><input type="password" maxLength={4} value={v} onChange={e => s(e.target.value.replace(/\D/g, "").slice(0, 4))} style={{ width: "100%", background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px", color: t.text, fontSize: 14, boxSizing: "border-box" }} /></div>)}
        {err && <div style={{ color: t.red, fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <button onClick={save} style={{ width: "100%", background: "#F97316", border: "none", borderRadius: 10, padding: "11px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Update PIN</button>
      </>}
    </div>
  </div>;
}
function AttendanceCalendar({ userId, allLogs, userName }: any) {
  const t = C(); const now = new Date(); const y = now.getFullYear(); const m = now.getMonth(); const dim = new Date(y, m + 1, 0).getDate();
  const approved = new Set(allLogs.filter((l: any) => l.closerId === userId && l.status === "approved" && new Date(l.date).getMonth() === m && new Date(l.date).getFullYear() === y).map((l: any) => new Date(l.date).getDate()));
  return <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{userName} — {now.toLocaleString("en", { month: "long", year: "numeric" })} ({approved.size}/{dim} days)</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{Array.from({ length: dim }, (_, i) => i + 1).map(d => <div key={d} style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, background: approved.has(d) ? "rgba(0,229,160,0.15)" : t.surface, color: approved.has(d) ? t.green : t.muted, border: `1px solid ${approved.has(d) ? "rgba(0,229,160,0.3)" : t.border}` }}>{d}</div>)}</div>
  </div>;
}

interface PortalProps { user: User; users: UserMap; teams: TeamMap; allReports: CallReport[]; allLogs: DailyLog[]; allNoAnswers: NoAnswerRecord[]; goals: Goal[]; onLogout: () => void; refresh: () => Promise<void>; saveUsersData: (u: UserMap) => Promise<void>; }

export function ManagementPortal({ user, users, teams, allReports, allLogs, allNoAnswers, goals, onLogout, refresh, saveUsersData }: PortalProps) {
  const t = C();
  const perms = getPerms(user);
  const [showChangePin, setShowChangePin] = useState(false);
  const [tab, setTab] = useState("overview");
  const [period, setPeriod] = useState("month");
  const [viewReport, setViewReport] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [newName, setNewName] = useState(""); const [newPin, setNewPin] = useState(""); const [newRole, setNewRole] = useState("closer"); const [newTeam, setNewTeam] = useState("team1"); const [showAdd, setShowAdd] = useState(false); const [saving, setSaving] = useState(false);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };
  const teamList = Object.values(teams || {});
  const allClosers = Object.values(users).filter((u: any) => ["closer", "teamlead"].includes(u.role));
  const card: any = { background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, marginBottom: 16 };
  const accentTop = (c: string): any => ({ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c, borderRadius: "12px 12px 0 0" });
  const pill = (c: string) => ({ background: `${c}22`, color: c, border: `1px solid ${c}44`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 });
  const nb = (id: string, lbl: string) => <button onClick={() => setTab(id)} style={{ background: tab === id ? "rgba(249,115,22,0.15)" : "transparent", color: tab === id ? "#F97316" : "rgba(255,255,255,0.45)", border: tab === id ? "1px solid rgba(249,115,22,0.35)" : "1px solid transparent", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: tab === id ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap" }}>{lbl}</button>;

  const addUser = async () => {
    if (!newName.trim() || newPin.length !== 4) return;
    setSaving(true);
    const id = `user_${uid()}`; const empNums = Object.values(users).map((u: any) => parseInt(u.employeeId?.replace(/\D/g, "") || "0")).filter(Boolean); const nextNum = Math.max(0, ...empNums) + 1; const empId = ["closer", "teamlead"].includes(newRole) ? `SC${String(nextNum).padStart(3, "0")}` : `MGT${String(nextNum).padStart(3, "0")}`;
    const u = { ...users, [id]: { id, name: newName.trim(), employeeId: empId, pin: newPin, role: newRole, teamId: ["closer", "teamlead"].includes(newRole) ? newTeam : null, createdAt: Date.now() } };
    await saveUsersData(u as UserMap); await refresh(); setNewName(""); setNewPin(""); setShowAdd(false); setSaving(false); flash("✅ Account created!");
  };

  // Company stats
  const fLogs = filterByPeriod(allLogs.filter(l => l.status === "approved"), "date", period);
  const totalDelivered = fLogs.reduce((s: number, l: any) => s + (+l.delivered || 0), 0);
  const totalAssigned = fLogs.reduce((s: number, l: any) => s + (+(l.callsThrough || l.assigned) || 0), 0);
  const totalComm = fLogs.reduce((s: number, l: any) => s + ((l.commission?.total) || 0), 0);
  const overallRate = totalAssigned > 0 ? Math.round(totalDelivered / totalAssigned * 100) : 0;
  const fReports = filterByPeriod(allReports, "date", period);

  // Team breakdown
  const teamStats = teamList.map((team: any) => {
    const tLogs = fLogs.filter((l: any) => l.teamId === team.id);
    const tDel = tLogs.reduce((s: number, l: any) => s + (+l.delivered || 0), 0);
    const tAss = tLogs.reduce((s: number, l: any) => s + (+(l.callsThrough || l.assigned) || 0), 0);
    const rate = tAss > 0 ? Math.round(tDel / tAss * 100) : 0;
    const comm = tLogs.reduce((s: number, l: any) => s + ((l.commission?.total) || 0), 0);
    const members = Object.values(users).filter((u: any) => u.teamId === team.id && u.role === "closer");
    return { ...team, delivered: tDel, assigned: tAss, rate, comm, memberCount: members.length };
  });

  return <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 64, background: t.navBg, borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#F97316,#EA580C)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
        </div>
        <div><div style={{ fontSize: 13, fontWeight: 800 }}>Shoppyrex SalesCoach</div><div style={{ fontSize: 9, color: t.green, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{ROLE_LABELS[user.role] || user.role}</div></div>
      </div>
      <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none" as any }}>
        {nb("overview", "📊 Overview")}
        {nb("teams", "👥 Teams")}
        {nb("calls", "🎙️ All Calls")}
        {nb("commission", "💰 Commission")}
        {nb("attendance", "📅 Attendance")}
        {nb("leaderboard", "🏆 Leaderboard")}
        {nb("summary", "✨ AI Summary")}
        {perms.manageUsers && nb("users", "⚙️ Users")}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, fontWeight: 700 }}>{user.name}</div><div style={{ fontSize: 9, color: t.muted }}>{ROLE_LABELS[user.role]}</div></div>
        <ThemeToggle />
        <button onClick={() => setShowChangePin(true)} style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, padding: "4px 10px", color: "#F97316", cursor: "pointer", fontSize: 11 }}>🔒 PIN</button>
        <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${t.border}`, borderRadius: 8, padding: "4px 10px", color: t.muted, cursor: "pointer", fontSize: 11 }}>Sign Out</button>
      </div>
    </nav>

    <main style={{ width: "100%", maxWidth: 1400, margin: "0 auto", padding: "24px 32px", position: "relative", zIndex: 1 }}>
      {msg && <div style={{ background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: t.green }}>{msg}</div>}

      {/* Overview */}
      {tab === "overview" && <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>📊 Company Overview</h1>
        <p style={{ fontSize: 13, color: t.muted, marginBottom: 16 }}>Hello, {user.name.split(" ")[0]}. Here's the full picture.</p>
        <PeriodFilter value={period} onChange={setPeriod} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { l: "Total Calls", v: fReports.length, c: t.green },
            { l: "Delivery Rate", v: overallRate + "%", c: overallRate >= 90 ? t.green : overallRate >= 65 ? t.yellow : t.red },
            { l: "Total Commission", v: fmtNaira(totalComm), c: t.yellow },
            { l: "Active Teams", v: teamList.length, c: t.blue },
            { l: "Total Staff", v: Object.values(users).length, c: t.purple },
            { l: "Pending Approvals", v: allLogs.filter(l => l.status === "pending").length, c: t.orange },
          ].map((s, i) => <div key={i} style={{ ...card, position: "relative", overflow: "hidden", marginBottom: 0 }}>
            <div style={accentTop(s.c)} />
            <div style={{ fontSize: 10, color: t.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{s.l}</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{s.v}</div>
          </div>)}
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Team Breakdown</h2>
        {teamStats.map((team: any) => <div key={team.id} style={{ ...card, position: "relative", overflow: "hidden" }}>
          <div style={accentTop(team.rate >= 90 ? t.green : team.rate >= 65 ? t.yellow : t.red)} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{teamTypeIcon(team.type)} {team.name}</div>
              <div style={{ fontSize: 11, color: t.muted }}>{team.memberCount} closers · {team.delivered} delivered / {team.assigned} assigned</div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={pill(team.rate >= 90 ? t.green : team.rate >= 65 ? t.yellow : team.rate >= 50 ? t.orange : t.red)}>{team.rate}%</span>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: t.muted }}>Commission</div><div style={{ fontSize: 16, fontWeight: 800, color: t.yellow }}>{fmtNaira(team.comm)}</div></div>
            </div>
          </div>
        </div>)}
      </div>}

      {/* Teams */}
      {tab === "teams" && <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>👥 All Teams</h1>
        <PeriodFilter value={period} onChange={setPeriod} />
        {teamList.map((team: any) => {
          const members = Object.values(users).filter((u: any) => u.teamId === team.id && ["closer", "teamlead"].includes(u.role));
          return <div key={team.id} style={{ ...card, marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{teamTypeIcon(team.type)} {team.name}</div>
            {members.map((m: any) => {
              const mLogs = filterByPeriod(allLogs.filter(l => l.closerId === m.id && l.status === "approved"), "date", period);
              const tot = mLogs.reduce((s: number, l: any) => s + (+(l.callsThrough || l.assigned) || 0), 0);
              const del = mLogs.reduce((s: number, l: any) => s + (+l.delivered || 0), 0);
              const rate = tot > 0 ? Math.round(del / tot * 100) : 0;
              const todayLog = allLogs.find(l => l.closerId === m.id && l.date === todayStr());
              return <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,229,160,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: t.green }}>{m.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</div><div style={{ fontSize: 11, color: t.muted }}>{ROLE_LABELS[m.role]} · {m.employeeId}</div></div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={pill(rate >= 90 ? t.green : rate >= 65 ? t.yellow : rate >= 50 ? t.orange : t.red)}>{rate}%</span>
                  {!todayLog && <span style={pill(t.red)}>No log today</span>}
                </div>
              </div>;
            })}
          </div>;
        })}
      </div>}

      {/* Calls */}
      {tab === "calls" && <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>🎙️ All Call Reports</h1>
        <PeriodFilter value={period} onChange={setPeriod} />
        {filterByPeriod(allReports, "date", period).length === 0 ? <div style={{ ...card, textAlign: "center", padding: "40px", color: t.muted }}>No calls in this period.</div> :
          filterByPeriod(allReports, "date", period).sort((a, b) => b.date - a.date).map(r =>
            <div key={r.id} style={{ ...card, cursor: "pointer", position: "relative", overflow: "hidden" }} onClick={() => setViewReport(r)}>
              <div style={accentTop(scoreColor(r.analysis?.overallScore || 0))} />
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.closerName} · {r.product || "General"} · {r.callType === "whatsapp" ? "💬" : "📞"}</div>
                  <div style={{ fontSize: 11, color: t.muted }}>{fmtDate(r.date)} · {(teams as any)[r.teamId]?.name || r.teamId}</div>
                  {r.analysis?.verdict && <div style={{ fontSize: 12, color: t.muted, marginTop: 3, maxWidth: 500 }}>{r.analysis.verdict.slice(0, 80)}...</div>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={pill(scoreColor(r.analysis?.overallScore || 0))}>{r.analysis?.overallScore || "—"}/100</span>
                  <span style={pill(outcomeColor(r.callOutcome))}>{outcomeLabel(r.callOutcome)}</span>
                </div>
              </div>
            </div>
          )
        }
      </div>}

      {/* Commission */}
      {tab === "commission" && <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>💰 Commission Dashboard</h1>
        <p style={{ fontSize: 13, color: t.muted, marginBottom: 16 }}>All amounts paid with end-of-month salary</p>
        <PeriodFilter value={period} onChange={setPeriod} />
        <div style={{ ...card, background: "rgba(255,182,39,0.05)", border: "1px solid rgba(255,182,39,0.2)", marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: t.yellow, marginBottom: 8 }}>🏆 Monthly Excellence Pool</div>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 12 }}>Closers with 90%+ delivery rate qualify. Manager distributes manually with salary.</div>
          {allClosers.filter((u: any) => { const l = filterByPeriod(allLogs.filter(x => x.closerId === u.id && x.status === "approved"), "date", "month"); const tot = l.reduce((s: number, x: any) => s + (+(x.callsThrough || x.assigned) || 0), 0); const del = l.reduce((s: number, x: any) => s + (+x.delivered || 0), 0); return tot > 0 && Math.round(del / tot * 100) >= 90; }).length === 0
            ? <div style={{ fontSize: 12, color: t.muted }}>No qualifiers this month.</div>
            : <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {allClosers.filter((u: any) => { const l = filterByPeriod(allLogs.filter(x => x.closerId === u.id && x.status === "approved"), "date", "month"); const tot = l.reduce((s: number, x: any) => s + (+(x.callsThrough || x.assigned) || 0), 0); const del = l.reduce((s: number, x: any) => s + (+x.delivered || 0), 0); return tot > 0 && Math.round(del / tot * 100) >= 90; }).map((u: any) => {
                const l = filterByPeriod(allLogs.filter(x => x.closerId === u.id && x.status === "approved"), "date", "month"); const tot = l.reduce((s: number, x: any) => s + (+(x.callsThrough || x.assigned) || 0), 0); const del = l.reduce((s: number, x: any) => s + (+x.delivered || 0), 0); const rate = tot > 0 ? Math.round(del / tot * 100) : 0;
                return <div key={u.id} style={{ background: "rgba(255,182,39,0.1)", border: "1px solid rgba(255,182,39,0.25)", borderRadius: 10, padding: "9px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: t.muted }}>{(teams as any)[u.teamId]?.name}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: t.yellow }}>{rate}%</div>
                </div>;
              })}
            </div>
          }
        </div>
        <div style={{ ...card }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Name", "Team", "Del/Ass", "Rate", "Commission"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 11, color: t.muted, fontWeight: 700, padding: "8px 12px", borderBottom: `1px solid ${t.border}` }}>{h}</th>)}</tr></thead>
            <tbody>{allClosers.map((u: any) => {
              const l = filterByPeriod(allLogs.filter(x => x.closerId === u.id && x.status === "approved"), "date", period);
              const tot = l.reduce((s: number, x: any) => s + (+(x.callsThrough || x.assigned) || 0), 0);
              const del = l.reduce((s: number, x: any) => s + (+x.delivered || 0), 0);
              const rate = tot > 0 ? Math.round(del / tot * 100) : 0;
              const comm = l.reduce((s: number, x: any) => s + ((x.commission?.total) || 0), 0);
              return <tr key={u.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{u.name}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: t.muted }}>{(teams as any)[u.teamId]?.name || "—"}</td>
                <td style={{ padding: "10px 12px", fontSize: 12 }}>{del}/{tot}</td>
                <td style={{ padding: "10px 12px" }}><span style={pill(rate >= 90 ? t.green : rate >= 65 ? t.yellow : rate >= 50 ? t.orange : t.red)}>{rate}%</span></td>
                <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: t.yellow }}>{fmtNaira(comm)}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </div>}

      {/* Attendance */}
      {tab === "attendance" && <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>📅 Company Attendance</h1>
        <p style={{ fontSize: 13, color: t.muted, marginBottom: 16 }}>Each approved log = present day</p>
        {allClosers.map((u: any) => <AttendanceCalendar key={u.id} userId={u.id} allLogs={allLogs} userName={u.name} />)}
      </div>}

      {/* Leaderboard */}
      {tab === "leaderboard" && <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>🏆 Company Leaderboard</h1>
        <PeriodFilter value={period} onChange={setPeriod} />
        <div style={card}>
          {[...allClosers].sort((a: any, b: any) => {
            const rate = (u: any) => { const l = filterByPeriod(allLogs.filter(x => x.closerId === u.id && x.status === "approved"), "date", period); const tot = l.reduce((s: number, x: any) => s + (+(x.callsThrough || x.assigned) || 0), 0); const del = l.reduce((s: number, x: any) => s + (+x.delivered || 0), 0); return tot > 0 ? Math.round(del / tot * 100) : 0; };
            return rate(b) - rate(a);
          }).map((u: any, i: number) => {
            const l = filterByPeriod(allLogs.filter(x => x.closerId === u.id && x.status === "approved"), "date", period);
            const tot = l.reduce((s: number, x: any) => s + (+(x.callsThrough || x.assigned) || 0), 0);
            const del = l.reduce((s: number, x: any) => s + (+x.delivered || 0), 0);
            const rate = tot > 0 ? Math.round(del / tot * 100) : 0;
            return <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < allClosers.length - 1 ? `1px solid ${t.border}` : "none" }}>
              <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: t.muted }}>{(teams as any)[u.teamId]?.name} · {del} delivered / {tot} assigned</div>
              </div>
              <span style={pill(rate >= 90 ? t.green : rate >= 65 ? t.yellow : rate >= 50 ? t.orange : t.red)}>{rate}%</span>
            </div>;
          })}
        </div>
      </div>}

      {/* AI Summary */}
      {tab === "summary" && <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>✨ AI Summary Reports</h1>
        <div style={{ ...card, textAlign: "center", color: t.muted, padding: "40px" }}>AI Summary feature coming soon. Full company-wide reports generated via Claude API.</div>
      </div>}

      {/* Users Management */}
      {tab === "users" && perms.manageUsers && <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>⚙️ User Management</h1>
          <button onClick={() => setShowAdd(!showAdd)} style={{ background: showAdd ? "rgba(255,255,255,0.05)" : "#F97316", border: "none", borderRadius: 10, padding: "9px 18px", color: showAdd ? t.muted : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{showAdd ? "✕ Cancel" : "＋ Add User"}</button>
        </div>
        {showAdd && <div style={{ ...card, background: "rgba(0,229,160,0.04)", border: "1px solid rgba(0,229,160,0.15)", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.green, marginBottom: 14 }}>New Account</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><label style={{ fontSize: 11, color: t.muted, display: "block", marginBottom: 4 }}>Full Name</label><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" style={{ width: "100%", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "8px 10px", color: t.text, fontSize: 13, boxSizing: "border-box" }} /></div>
            <div><label style={{ fontSize: 11, color: t.muted, display: "block", marginBottom: 4 }}>4-Digit PIN</label><input value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))} maxLength={4} placeholder="e.g. 2009" style={{ width: "100%", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "8px 10px", color: t.text, fontSize: 13, boxSizing: "border-box" }} /></div>
            <div><label style={{ fontSize: 11, color: t.muted, display: "block", marginBottom: 4 }}>Role</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: "100%", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "8px 10px", color: t.text, fontSize: 13 }}>
                {["closer", "teamlead", "head_sales", "head_creative", "hr", "gm"].map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            {["closer", "teamlead"].includes(newRole) && <div><label style={{ fontSize: 11, color: t.muted, display: "block", marginBottom: 4 }}>Team</label>
              <select value={newTeam} onChange={e => setNewTeam(e.target.value)} style={{ width: "100%", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "8px 10px", color: t.text, fontSize: 13 }}>
                {teamList.map((tm: any) => <option key={tm.id} value={tm.id}>{teamTypeIcon(tm.type)} {tm.name}</option>)}
              </select>
            </div>}
          </div>
          <button onClick={addUser} disabled={!newName.trim() || newPin.length !== 4 || saving} style={{ background: "#F97316", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: !newName.trim() || newPin.length !== 4 ? 0.5 : 1 }}>{saving ? "Creating..." : "✅ Create Account"}</button>
        </div>}
        <div style={card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["ID", "Name", "Role", "Team", "PIN"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 11, color: t.muted, fontWeight: 700, padding: "8px 12px", borderBottom: `1px solid ${t.border}` }}>{h}</th>)}</tr></thead>
            <tbody>{Object.values(users).sort((a: any, b: any) => { const o: any = { ceo: 0, gm: 1, head_sales: 2, head_creative: 3, hr: 4, teamlead: 5, closer: 6 }; return (o[a.role] ?? 9) - (o[b.role] ?? 9); }).map((u: any) =>
              <tr key={u.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                <td style={{ padding: "10px 12px", fontSize: 11, color: t.muted }}>{u.employeeId}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{u.name}</td>
                <td style={{ padding: "10px 12px" }}><span style={pill(({ ceo: t.yellow, gm: t.purple, head_sales: t.orange, head_creative: t.blue, hr: t.pink, teamlead: t.orange, closer: t.green } as any)[u.role] || t.muted)}>{ROLE_LABELS[u.role] || u.role}</span></td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: t.muted }}>{(teams as any)[u.teamId]?.name || "—"}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: t.muted }}>{user.role === "ceo" ? u.pin : "••••"}</td>
              </tr>
            )}</tbody>
          </table>
        </div>
      </div>}
    </main>

    {viewReport && <ReportModal report={viewReport} onClose={() => setViewReport(null)} />}
    {showChangePin && <ChangePinModal user={user} onClose={() => setShowChangePin(false)} refresh={refresh} saveUsersData={saveUsersData} allUsers={users} />}
  </div>;
}
