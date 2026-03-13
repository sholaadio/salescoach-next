"use client";
/* eslint-disable */
// Migrated directly from index.html — original logic preserved
import React, { useState, useEffect, useRef } from "react";
import { saveDailyLog, addNoAnswer } from "@/lib/api";

const uid = () => Math.random().toString(36).slice(2, 9);
const scoreColor = (s: number) => s >= 80 ? "#F97316" : s >= 60 ? "#FFB627" : "#FF6B6B";
const tierColor = (t: string) => ({ gold: "#FFB627", silver: "#9CA3AF", bronze: "#CD7C2F", none: "#5A6A80", flat: "#60A5FA" } as any)[t] || "#5A6A80";
const fmtDate = (d: any) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
const fmtNaira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;
const todayStr = () => new Date().toISOString().slice(0, 10);
const outcomeColor = (o: string) => ({ confirmed: "#F97316", cancelled: "#FF6B6B", followup: "#FFB627", switchedoff: "#5A6A80", callback: "#A78BFA", unknown: "#5A6A80" } as any)[o] || "#5A6A80";
const outcomeLabel = (o: string) => ({ confirmed: "✅ Confirmed", cancelled: "❌ Cancelled", followup: "🔄 Follow-up", switchedoff: "📵 Switched Off", callback: "⏰ Call Back", unknown: "🤷 Unknown" } as any)[o] || "Unknown";
const teamTypeIcon = (t: string) => ({ sales: "💼", followup: "🔄", socialmedia: "📱" } as any)[t] || "💼";

const DARK_THEME: any = { bg: "#07080F", card: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)", text: "#F1F5FF", soft: "#C8D3E8", muted: "#6A7A90", green: "#00E5A0", yellow: "#FBBF24", red: "#FF6B6B", orange: "#F97316", navBg: "rgba(6,10,18,0.97)", surface: "rgba(255,255,255,0.03)", blue: "#60A5FA", purple: "#A78BFA", pink: "#F472B6" };
const LIGHT_THEME: any = { bg: "#F0F4FF", card: "rgba(255,255,255,0.9)", border: "rgba(0,0,0,0.08)", text: "#0A0E1A", soft: "#1E293B", muted: "#64748B", green: "#059669", yellow: "#D97706", red: "#DC2626", orange: "#EA580C", navBg: "rgba(255,255,255,0.97)", surface: "rgba(0,0,0,0.02)", blue: "#2563EB", purple: "#7C3AED", pink: "#DB2777" };
const getTheme = () => { try { return typeof localStorage !== "undefined" && localStorage.getItem("sc_theme") === "light" ? LIGHT_THEME : DARK_THEME; } catch(e) { return DARK_THEME; } };

function calcSalesCommission(assigned: number, delivered: number, upsells = 0, repeats = 0, referrals = 0) {
  const a = Math.max(+assigned || 0, 0); const d = +delivered || 0;
  if (a === 0) return { rate: 0, perOrder: 0, base: 0, upsellBonus: 0, repeatBonus: 0, referralBonus: 0, total: 0, tier: "none", upsellLocked: false };
  const rate = d / a * 100; let perOrder = 0; let tier = "none";
  if (rate >= 90) { perOrder = 200; tier = "gold"; } else if (rate >= 65) { perOrder = 150; tier = "silver"; } else if (rate >= 50) { perOrder = 100; tier = "bronze"; }
  const base = d * perOrder; const upsellLocked = rate < 50;
  const upsellBonus = upsellLocked ? 0 : (+upsells || 0) * 600;
  const repeatBonus = (+repeats || 0) * 300; const referralBonus = (+referrals || 0) * 300;
  return { rate: Math.round(rate), perOrder, base, upsellBonus, repeatBonus, referralBonus, total: base + upsellBonus + repeatBonus + referralBonus, tier, upsellLocked };
}

function calcFollowupCommission(callsMade: number, callsThrough: number, delivered: number, upsells = 0, repeats = 0, referrals = 0) {
  const a = Math.max(+callsThrough || 0, 0); const d = +delivered || 0;
  if (a === 0) return { rate: 0, perOrder: 0, base: 0, upsellBonus: 0, repeatBonus: 0, referralBonus: 0, total: 0, tier: "none", upsellLocked: false };
  const rate = d / a * 100; let perOrder = 0; let tier = "none";
  if (rate >= 90) { perOrder = 200; tier = "gold"; } else if (rate >= 65) { perOrder = 150; tier = "silver"; } else if (rate >= 50) { perOrder = 100; tier = "bronze"; }
  const base = d * perOrder; const upsellLocked = false;
  const upsellBonus = (+upsells || 0) * 600; const repeatBonus = (+repeats || 0) * 300; const referralBonus = (+referrals || 0) * 300;
  return { rate: Math.round(rate), perOrder, base, upsellBonus, repeatBonus, referralBonus, total: base + upsellBonus + repeatBonus + referralBonus, tier, upsellLocked };
}

function filterByPeriod(items: any[], field: string, period: string) {
  const now = new Date();
  return items.filter(item => {
    const d = new Date(item[field]);
    if (period === "day") return d.toDateString() === now.toDateString();
    if (period === "week") { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "year") return d.getFullYear() === now.getFullYear();
    return true;
  });
}

function filterLogsByPeriod(logs: any[], period: string) {
  const now = new Date();
  return logs.filter(l => {
    const d = new Date(l.date);
    if (period === "day") return d.toDateString() === now.toDateString();
    if (period === "week") { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "year") return d.getFullYear() === now.getFullYear();
    return true;
  });
}

// ─── Shared sub-components (exact from index.html) ──────────────────────────

function TrendChart({ reports }: any) {
  if (!reports || reports.length === 0) return null;
  const last30 = [...reports].sort((a, b) => new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime()).slice(-30);
  const scores = last30.map((r: any) => r.analysis?.overallScore || 0);
  const max = Math.max(...scores, 1);
  const W = 280, H = 60;
  const pts = scores.map((s, i) => `${i / (scores.length - 1 || 1) * W},${H - (s / max * H * 0.85 + 4)}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke="#F97316" strokeWidth={2} strokeLinejoin="round" />
      {scores.map((s, i) => <circle key={i} cx={i / (scores.length - 1 || 1) * W} cy={H - (s / max * H * 0.85 + 4)} r={3} fill="#F97316" />)}
    </svg>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => { try { setIsDark(localStorage.getItem("sc_theme") !== "light"); } catch(e) {} }, []);
  const toggle = () => {
    const next = isDark ? "light" : "dark";
    try { localStorage.setItem("sc_theme", next); } catch(e) {}
    window.location.reload();
  };
  return <button onClick={toggle} title={isDark ? "Switch to Light" : "Switch to Dark"} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "4px 10px", color: "#6A7A90", cursor: "pointer", fontSize: 14 }}>{isDark ? "☀️" : "🌙"}</button>;
}

function ChangePinModal({ user, onClose, saveUsersData, refresh, allUsers }: any) {
  const C = getTheme();
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async () => {
    setError("");
    if (oldPin !== user.pin) { setError("Current PIN is incorrect"); return; }
    if (newPin.length < 4) { setError("New PIN must be at least 4 digits"); return; }
    if (newPin !== confirm) { setError("PINs do not match"); return; }
    setSaving(true);
    try {
      if (saveUsersData && allUsers) await saveUsersData({ ...allUsers, [user.id]: { ...user, pin: newPin } });
      if (refresh) await refresh();
      setDone(true);
    } catch(e) { setError("Failed to update PIN. Check connection."); }
    setSaving(false);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#0C1320", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 20, padding: 28, maxWidth: 360, width: "100%" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 8 }}>PIN Updated!</div>
            <button onClick={onClose} style={{ background: "#F97316", border: "none", borderRadius: 10, padding: "10px 24px", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 17, fontWeight: 900, color: C.text, marginBottom: 4 }}>🔒 Change Your PIN</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Keep your account secure</div>
            {[["Current PIN", oldPin, setOldPin], ["New PIN", newPin, setNewPin], ["Confirm New PIN", confirm, setConfirm]].map(([label, val, set]: any) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
                <input type="password" inputMode="numeric" value={val} onChange={e => set(e.target.value)} maxLength={8}
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: C.text, fontSize: 18, letterSpacing: "0.3em", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
            ))}
            {error && <div style={{ color: "#FF6B6B", fontSize: 12, marginBottom: 12 }}>⚠️ {error}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={onClose} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 11, color: C.muted, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>Cancel</button>
              <button onClick={submit} disabled={saving} style={{ flex: 2, background: "linear-gradient(135deg,#F97316,#EA580C)", border: "none", borderRadius: 10, padding: 11, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{saving ? "Updating..." : "Update PIN"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OnboardingModal({ user, onClose }: any) {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: "📊", title: "Welcome to SalesCoach!", body: "Track your calls, log your daily sales, and get AI-powered coaching to improve your performance." },
    { icon: "🎙️", title: "Upload Your Calls", body: "Record your sales calls and upload them here. Our AI will analyse your technique and give you specific feedback." },
    { icon: "🏆", title: "Compete & Improve", body: "See how you rank against your team. Use the AI Summary to understand your patterns and set targets." }
  ];
  const s = steps[step];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#07080F", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 20, padding: 32, maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{s.icon}</div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#F1F5FF", marginBottom: 12, margin: "0 0 12px" }}>{s.title}</h2>
        <p style={{ fontSize: 14, color: "#6A7A90", lineHeight: 1.7, marginBottom: 24 }}>{s.body}</p>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 }}>
          {steps.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: i === step ? "#F97316" : "rgba(255,255,255,0.15)" }} />)}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 20px", color: "#6A7A90", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>Back</button>}
          <button onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : onClose()} style={{ background: "linear-gradient(135deg,#F97316,#EA580C)", border: "none", borderRadius: 10, padding: "10px 28px", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {step < steps.length - 1 ? "Next →" : "Get Started 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ report, onClose }: any) {
  const C = getTheme();
  const score = report.analysis?.overallScore || 0;
  const sc = scoreColor(score);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, maxWidth: 560, width: "100%", maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{report.product || "Call"} · {fmtDate(report.date)}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 24, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ background: sc + "18", color: sc, borderRadius: 20, padding: "4px 14px", fontSize: 14, fontWeight: 700 }}>{score}/100</span>
          <span style={{ background: outcomeColor(report.callOutcome) + "18", color: outcomeColor(report.callOutcome), borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 600 }}>{outcomeLabel(report.callOutcome)}</span>
        </div>
        {report.analysis?.verdict && <p style={{ color: C.soft, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{report.analysis.verdict}</p>}
        {report.analysis?.strengths?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>✅ Strengths</div>
            {report.analysis.strengths.map((s: string, i: number) => <div key={i} style={{ fontSize: 13, color: C.soft, marginBottom: 4 }}>• {s}</div>)}
          </div>
        )}
        {report.analysis?.weaknesses?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.yellow, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>⚠️ Weaknesses</div>
            {report.analysis.weaknesses.map((w: string, i: number) => <div key={i} style={{ fontSize: 13, color: C.soft, marginBottom: 4 }}>• {w}</div>)}
          </div>
        )}
        {report.analysis?.actionPlan?.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>🎯 Action Plan</div>
            {report.analysis.actionPlan.map((a: string, i: number) => <div key={i} style={{ fontSize: 13, color: C.soft, marginBottom: 4 }}>{i + 1}. {a}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

function SalesDailyLogForm({ user, existingLog, onSaved }: any) {
  const C = getTheme();
  const [form, setForm] = useState({
    assigned: existingLog?.assigned ?? "",
    delivered: existingLog?.delivered ?? "",
    upsells: existingLog?.upsells ?? "",
    repeats: existingLog?.repeats ?? "",
    referrals: existingLog?.referrals ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const comm = calcSalesCommission(+form.assigned || 0, +form.delivered || 0, +form.upsells || 0, +form.repeats || 0, +form.referrals || 0);

  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 15px", color: C.text, fontSize: 15, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 8 };

  const handleSave = async () => {
    setSaving(true);
    const log = {
      id: existingLog?.id ?? uid(),
      closerId: user.id, closerName: user.name, teamId: user.teamId, teamType: "sales",
      date: todayStr(), status: existingLog?.status ?? "pending",
      assigned: +form.assigned || 0, delivered: +form.delivered || 0,
      upsells: +form.upsells || 0, repeats: +form.repeats || 0, referrals: +form.referrals || 0,
      commission: comm
    };
    await saveDailyLog(log);
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); onSaved(log); }, 1500);
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {[["Assigned Leads", "assigned"], ["Delivered", "delivered"], ["Upsells", "upsells"], ["Repeat Customers", "repeats"], ["Referrals", "referrals"]].map(([label, key]) => (
          <div key={key}>
            <label style={labelStyle}>{label}{key === "upsells" && <span style={{ color: "#4B5563", fontWeight: 400, textTransform: "none" }}> — requires ≥50% rate</span>}</label>
            <input type="number" min="0" value={(form as any)[key]} onChange={e => set(key, e.target.value)} style={inputStyle} />
          </div>
        ))}
      </div>

      {+form.assigned > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: C.muted, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Commission Preview</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.muted, fontSize: 13 }}>{comm.rate}% · <span style={{ color: tierColor(comm.tier), fontWeight: 700 }}>{comm.tier} tier</span></span>
            <span style={{ color: C.green, fontSize: 20, fontWeight: 700 }}>{fmtNaira(comm.total)}</span>
          </div>
          {comm.upsellLocked && <p style={{ color: C.red, fontSize: 11, margin: "6px 0 0" }}>🔒 Upsell locked — need ≥50% delivery rate</p>}
        </div>
      )}

      <button onClick={handleSave} disabled={saving || saved || !form.assigned}
        style={{ width: "100%", padding: 13, background: saved ? C.green : "linear-gradient(135deg,#F97316,#EA580C)", color: "#060A12", border: "none", borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: !form.assigned ? 0.5 : 1 }}>
        {saved ? "✅ Saved!" : saving ? "Saving..." : existingLog ? "Update Log" : "Submit Log"}
      </button>
    </div>
  );
}

function FollowupDailyLogForm({ user, existingLog, onSaved }: any) {
  const C = getTheme();
  const [form, setForm] = useState({
    callsMade: existingLog?.callsMade ?? "",
    callsThrough: existingLog?.callsThrough ?? "",
    delivered: existingLog?.delivered ?? "",
    upsells: existingLog?.upsells ?? "",
    repeats: existingLog?.repeats ?? "",
    referrals: existingLog?.referrals ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const comm = calcFollowupCommission(+form.callsMade || 0, +form.callsThrough || 0, +form.delivered || 0, +form.upsells || 0, +form.repeats || 0, +form.referrals || 0);

  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 15px", color: C.text, fontSize: 15, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 8 };

  const handleSave = async () => {
    setSaving(true);
    const log = {
      id: existingLog?.id ?? uid(),
      closerId: user.id, closerName: user.name, teamId: user.teamId, teamType: "followup",
      date: todayStr(), status: existingLog?.status ?? "pending",
      callsMade: +form.callsMade || 0, callsThrough: +form.callsThrough || 0,
      delivered: +form.delivered || 0, upsells: +form.upsells || 0,
      repeats: +form.repeats || 0, referrals: +form.referrals || 0,
      commission: comm
    };
    await saveDailyLog(log);
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); onSaved(log); }, 1500);
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Rate = Delivered ÷ Calls Through (not total calls made)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {[["Calls Made", "callsMade"], ["Calls Through", "callsThrough"], ["Delivered", "delivered"], ["Upsells", "upsells"], ["Repeats", "repeats"], ["Referrals", "referrals"]].map(([label, key]) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            <input type="number" min="0" value={(form as any)[key]} onChange={e => set(key, e.target.value)} style={inputStyle} />
          </div>
        ))}
      </div>
      {+form.callsThrough > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.muted, fontSize: 13 }}>{comm.rate}% · <span style={{ color: tierColor(comm.tier), fontWeight: 700 }}>{comm.tier} tier</span></span>
            <span style={{ color: C.green, fontSize: 20, fontWeight: 700 }}>{fmtNaira(comm.total)}</span>
          </div>
        </div>
      )}
      <button onClick={handleSave} disabled={saving || saved}
        style={{ width: "100%", padding: 13, background: saved ? C.green : "linear-gradient(135deg,#F97316,#EA580C)", color: "#060A12", border: "none", borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
        {saved ? "✅ Saved!" : saving ? "Saving..." : existingLog ? "Update Log" : "Submit Log"}
      </button>
    </div>
  );
}

function NoAnswerForm({ user, onSaved }: any) {
  const C = getTheme();
  const [form, setForm] = useState({ count: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 15px", color: C.text, fontSize: 15, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" };
  const handleSave = async () => {
    setSaving(true);
    await addNoAnswer({ id: uid(), closerId: user.id, closerName: user.name, teamId: user.teamId, date: todayStr(), count: +form.count || 0, notes: form.notes });
    setSaving(false);
    setForm({ count: "", notes: "" });
    onSaved();
  };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Number of No-Answers</label>
        <input type="number" min="0" value={form.count} onChange={e => setForm(f => ({ ...f, count: e.target.value }))} style={inputStyle} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Notes (optional)</label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
          style={{ ...inputStyle, resize: "none" }} />
      </div>
      <button onClick={handleSave} disabled={saving || !form.count}
        style={{ width: "100%", padding: 13, background: "linear-gradient(135deg,#F97316,#EA580C)", color: "#060A12", border: "none", borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: !form.count ? 0.5 : 1 }}>
        {saving ? "Saving..." : "Log No-Answers"}
      </button>
    </div>
  );
}

// ─── Main CloserPortal ────────────────────────────────────────────────────────

export function CloserPortal({ user, users, teams, allReports, allLogs, allNoAnswers, goals, onLogout, refresh, saveUsersData }: any) {
  const C = getTheme();
  const [tab, setTab] = useState("dashboard");
  const [period, setPeriod] = useState("month");
  const [viewReport, setViewReport] = useState<any>(null);
  const [saved, setSaved] = useState("");
  const [showChangePin, setShowChangePin] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem("sc_onboarded_" + user.id); } catch(e) { return false; }
  });
  const closeOnboarding = () => {
    try { localStorage.setItem("sc_onboarded_" + user.id, "1"); } catch(e) {}
    setShowOnboarding(false);
  };

  const myTeam = teams?.[user?.teamId] ?? null;
  const teamType = myTeam?.type || "sales";
  const allMyReports = allReports.filter((r: any) => r.closerId === user.id);
  const myReports = filterByPeriod(allMyReports, "date", period).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const myLogs = allLogs.filter((l: any) => l.closerId === user.id).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const todayLog = myLogs.find((l: any) => l.date === todayStr());
  const filteredLogs = filterLogsByPeriod(myLogs.filter((l: any) => l.status === "approved"), period);
  const totalCalls = allMyReports.length;
  const avgScore = totalCalls > 0 ? Math.round(allMyReports.reduce((s: number, r: any) => s + (r.analysis?.overallScore || 0), 0) / totalCalls) : 0;
  const periodEarnings = teamType === "socialmedia"
    ? filteredLogs.reduce((s: number, l: any) => s + (l.commission?.perMember || 0), 0)
    : filteredLogs.reduce((s: number, l: any) => s + (l.commission?.total || 0), 0);
  const pAssigned = filteredLogs.reduce((s: number, l: any) => s + (+(l.callsThrough || l.leadsConfirmed || l.assigned) || 0), 0);
  const pDelivered = filteredLogs.reduce((s: number, l: any) => s + (+l.delivered || 0), 0);
  const pRate = pAssigned > 0 ? Math.round(pDelivered / pAssigned * 100) : 0;

  const now = new Date();
  const monthLogs = myLogs.filter((l: any) => {
    if (l.status !== "approved") return false;
    const d = new Date(l.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const mAssigned = monthLogs.reduce((s: number, l: any) => s + (+(l.callsThrough || l.leadsConfirmed || l.assigned) || 0), 0);
  const mDelivered = monthLogs.reduce((s: number, l: any) => s + (+l.delivered || 0), 0);
  const monthRate = mAssigned > 0 ? Math.round(mDelivered / mAssigned * 100) : 0;

  const renderLogForm = () => {
    if (teamType === "followup") return <FollowupDailyLogForm user={user} existingLog={todayLog} onSaved={async () => { await refresh(); setSaved("log"); setTimeout(() => setSaved(""), 3000); }} />;
    return <SalesDailyLogForm user={user} existingLog={todayLog} onSaved={async () => { await refresh(); setSaved("log"); setTimeout(() => setSaved(""), 3000); }} />;
  };

  const navItems = [
    { id: "dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Dashboard" },
    { id: "upload", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z", label: "Upload Call" },
    { id: "log", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", label: "Daily Log" },
    ...(teamType !== "socialmedia" ? [{ id: "noanswer", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636", label: "No Answer" }] : []),
    { id: "history", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "History" },
    { id: "attendance", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Attendance" },
    { id: "leaderboard", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", label: "Leaderboard" },
    { id: "summary", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", label: "AI Summary" },
  ];

  const initials = user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name.split(" ").pop();

  // ── StatCard — exact from original
  const StatCard = ({ label, value, sub, accentColor = "#5e6ad2", icon }: any) => (
    <div style={{ position: "relative", overflow: "hidden", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <p style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, margin: 0 }}>{label}</p>
        {icon && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>}
      </div>
      <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: accentColor === "#5e6ad2" ? C.text : accentColor, letterSpacing: "-0.01em", margin: "4px 0 0" }}>{value}</p>
      {sub && <p style={{ marginTop: 2, fontSize: 11, color: C.muted, margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );

  // ── PeriodTabs — exact from original
  const PeriodTabs = () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
      {[["day","Today"],["week","This Week"],["month","This Month"],["year","This Year"],["all","All Time"]].map(([v,l]) => (
        <button key={v} onClick={() => setPeriod(v)} style={{
          background: period===v ? "rgba(94,106,210,0.15)" : "transparent",
          color: period===v ? "#5e6ad2" : C.muted,
          border: period===v ? "1px solid rgba(94,106,210,0.3)" : "1px solid transparent",
          borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit"
        }}>{l}</button>
      ))}
    </div>
  );

  // ── CommRules — exact from original
  const CommRules = () => {
    const rules = teamType === "followup"
      ? [["🥇","90%+","₦200/order"],["🥈","65–89%","₦150"],["🥉","50–64%","₦100"],["","Below 50%","₦0"]]
      : [["🥇","90%+","₦200/delivered"],["🥈","65–89%","₦150"],["🥉","50–64%","₦100"],["","Below 50%","₦0"]];
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>Your Commission Rules</div>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#5b5b5e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2="12.01" y2={16} />
          </svg>
        </div>
        {teamType === "socialmedia" ? (
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 2 }}>
            <div>📱 Flat <span style={{ color: C.text, fontWeight: 600 }}>₦200/delivered</span> · Pool split equally among all members</div>
            <div>✅ Upsell ₦600 · Repeat ₦300 · Referral ₦300 always active</div>
            <div>👥 Mr Kelvin submits the team log</div>
          </div>
        ) : (
          <div>
            {teamType === "followup" && <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Rate = Delivered ÷ Calls Through (not total calls made)</div>}
            <div style={{ display: "flex", flexWrap: "wrap", columnGap: 24, rowGap: 8, marginBottom: 12 }}>
              {rules.map(([emoji, tier, reward]) => (
                <div key={tier} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  {emoji && <span>{emoji}</span>}
                  <span style={{ color: C.muted }}>{tier}</span>
                  <span style={{ color: C.muted }}>→</span>
                  <span style={{ color: C.text }}>{reward}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: C.muted }}>
              <span>⚡ Upsell ₦600{teamType === "sales" ? " (only if delivery rate ≥50%)" : ""}</span>
              <span>• Repeat ₦300</span>
              <span>• Referral ₦300</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── ExcellencePool — exact from original
  const ExcellencePool = () => {
    const qualified = monthRate >= 90;
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#5e6ad2", marginBottom: 6 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
              Monthly Excellence Pool
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>Hit 90%+ delivery rate all month to qualify. Manager splits pool with salary.</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#f5a623" }}>{monthRate}%</div>
            <div style={{ display: "inline-block", background: "rgba(245,166,35,0.1)", color: "#f5a623", borderRadius: 99, padding: "2px 10px", fontSize: 10, fontWeight: 500, marginTop: 4 }}>
              {qualified ? "✅ Qualified!" : "Need 90%+"}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 8, width: "100%", overflow: "hidden", borderRadius: 99, background: C.border }}>
            <div style={{ height: "100%", width: Math.min(monthRate, 100) + "%", background: "linear-gradient(to right, #10b981, #f5a623)", transition: "width 1s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: C.muted }}>
            <span>0%</span><span style={{ color: "#10b981" }}>90% Target</span><span>100%</span>
          </div>
        </div>
      </div>
    );
  };

  // ── RecentCallRow — exact from original
  const RecentCallRow = ({ r }: any) => {
    const score = r.analysis?.overallScore || 0;
    const sc = scoreColor(score);
    const oc = outcomeColor(r.callOutcome);
    return (
      <div onClick={() => setViewReport(r)} style={{ display: "flex", alignItems: "center", gap: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", cursor: "pointer", transition: "border-color 0.15s", marginBottom: 8 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${sc}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: sc, flexShrink: 0 }}>{score}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 2 }}>{(r.product || "General") + " · " + (r.callType === "whatsapp" ? "💬" : "📞")}</div>
          <div style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.analysis?.verdict || "—"}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, background: oc + "18", color: oc, borderRadius: 20, padding: "2px 10px", marginBottom: 4, fontWeight: 600 }}>{outcomeLabel(r.callOutcome)}</div>
          <div style={{ fontSize: 10, color: C.muted }}>{fmtDate(r.createdAt || r.date)}</div>
        </div>
      </div>
    );
  };

  // ── DashboardTab — exact from original
  const DashboardTab = () => {
    const recentCalls = [...allMyReports].sort((a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()).slice(0, 5);
    return (
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600, color: C.text, marginBottom: 4, letterSpacing: "-0.025em" }}>{greeting}, {firstName} 👋</div>
            <div style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>{myTeam?.name || "—"}</div>
          </div>
          <div>
            {!todayLog && <button onClick={() => setTab("log")} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 12, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#f97316", cursor: "pointer", fontFamily: "inherit" }}>📋 Daily log pending →</button>}
            {todayLog?.status === "pending" && <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "8px 16px", fontSize: 13, color: C.yellow }}>⏳ Log submitted — awaiting approval</div>}
            {todayLog?.status === "approved" && <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "8px 16px", fontSize: 13, color: C.green }}>✅ Today&apos;s log approved</div>}
          </div>
        </div>

        <PeriodTabs />

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          <StatCard label="Total Calls" value={totalCalls} sub="Analyzed by AI" accentColor="#5e6ad2" icon="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          <StatCard label="Avg AI Score" value={totalCalls > 0 ? avgScore + "/100" : "—"} sub={totalCalls > 0 ? (avgScore >= 80 ? "Excellent" : avgScore >= 60 ? "Good" : "Needs work") : "Upload a call"} accentColor={scoreColor(avgScore)} icon="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          <StatCard label="Period Earnings" value={fmtNaira(periodEarnings)} sub={teamType === "socialmedia" ? "Your share of pool" : "Paid with salary"} accentColor="#26b5ce" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <StatCard label={teamType === "followup" ? "Calls Through Rate" : "Delivery Rate"} value={pAssigned > 0 ? pRate + "%" : "—"} sub={pAssigned > 0 ? pDelivered + " of " + pAssigned + " delivered" : "No logs yet"} accentColor={pRate >= 90 ? "#10b981" : pRate >= 50 ? "#f5a623" : "#ef4444"} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </div>

        {/* Commission rules + Excellence pool */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <CommRules />
          {teamType !== "socialmedia" && <ExcellencePool />}
        </div>

        {/* Performance trend */}
        {allMyReports.length >= 3 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>📈 Performance Trend — Last 30 Days</div>
            <TrendChart reports={allMyReports} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: C.muted }}>
              <span>Older</span><span>Recent</span>
            </div>
          </div>
        )}

        {/* Recent calls */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>🔥 Recent Calls</div>
            <button onClick={() => setTab("history")} style={{ fontSize: 12, color: C.muted, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
          </div>
          {recentCalls.length === 0
            ? <div style={{ background: C.card, border: `1px dashed ${C.border}`, borderRadius: 8, padding: 40, textAlign: "center", color: "#4b4b4e" }}>
                <div style={{ fontSize: 14, marginBottom: 8 }}>No calls uploaded yet</div>
                <button onClick={() => setTab("upload")} style={{ fontSize: 12, color: "#5e6ad2", background: "none", border: "none", cursor: "pointer" }}>Upload your first call →</button>
              </div>
            : recentCalls.map((r: any) => <RecentCallRow key={r.id} r={r} />)
          }
        </div>
      </div>
    );
  };

  // ── Main layout — exact sidebar + header from original
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Geist','Inter',system-ui,sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${C.border}`, background: C.navBg, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 40 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px", height: 56, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#f97316,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>S</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>SalesCoach</div>
            <div style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>{myTeam?.name || "Sales Closer"}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: 8, overflowY: "auto" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer",
              background: tab === item.id ? "rgba(94,106,210,0.15)" : "transparent",
              color: tab === item.id ? "#5e6ad2" : C.muted,
              fontSize: 13, fontWeight: tab === item.id ? 500 : 400,
              marginBottom: 2, textAlign: "left", transition: "all 0.1s", fontFamily: "inherit"
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#5e6ad2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>Sales Closer</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            <button onClick={() => setShowChangePin(true)} style={{ flex: 1, padding: "6px 8px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>🔒 PIN</button>
            <ThemeToggle />
            <button onClick={onLogout} style={{ flex: 1, padding: "6px 8px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.red, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Sign out</button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Top header */}
        <header style={{ height: 56, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 24px", background: C.navBg, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
              {({ dashboard:"Dashboard", upload:"Upload Call", log:"Daily Log", noanswer:"No Answer", history:"History", attendance:"Attendance", leaderboard:"Leaderboard", summary:"AI Summary" } as any)[tab] || "Dashboard"}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>·</div>
            <div style={{ fontSize: 12, color: C.muted }}>
              {({ dashboard:"Your performance overview", upload:"Transcribe & analyze a call", log:"Submit today's log", noanswer:"Log unanswered calls", history:"All your past calls", attendance:"Your attendance record", leaderboard:"Team & company rankings", summary:"AI-powered period report" } as any)[tab] || ""}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 24, maxWidth: 1100, width: "100%" }}>
          {saved && (
            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.green }}>
              ✅ {saved === "log" ? "Log submitted! " + (teamType === "socialmedia" ? "Auto-approved." : "Waiting for team lead approval.") : "Logged successfully."}
            </div>
          )}

          {tab === "dashboard" && <DashboardTab />}

          {tab === "upload" && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4, letterSpacing: "-0.02em" }}>🎙️ Upload a Call</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Claude AI will transcribe, analyze and coach you</div>
              <div style={{ background: C.card, border: `1px dashed ${C.border}`, borderRadius: 12, padding: 40, textAlign: "center", color: C.muted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎙️</div>
                <div style={{ fontSize: 14, marginBottom: 6 }}>Call upload — coming soon in Next.js</div>
                <div style={{ fontSize: 12 }}>Audio transcription via API routes will be enabled here</div>
              </div>
            </div>
          )}

          {tab === "log" && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4, letterSpacing: "-0.02em" }}>📋 Daily Log</div>
              {teamType === "socialmedia"
                ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 32, textAlign: "center", color: C.muted }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>Team Log is submitted by Mr Kelvin</div>
                    <div style={{ fontSize: 12 }}>Your commission share appears on your dashboard once submitted.</div>
                  </div>
                : <div>
                    {renderLogForm()}
                    {myLogs.length > 1 && (
                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginTop: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 14 }}>Past Logs</div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>{[["Date"], [teamType === "followup" ? "Calls Through" : "Assigned"], ["Delivered"], ["Rate"], ["Commission"], ["Status"]].map(([h]) => (
                              <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                            ))}</tr>
                          </thead>
                          <tbody>
                            {myLogs.slice(1, 8).map((l: any) => (
                              <tr key={l.id}>
                                <td style={{ padding: "12px 14px", fontSize: 13, color: C.soft, borderBottom: `1px solid ${C.border}` }}>{l.date}</td>
                                <td style={{ padding: "12px 14px", fontSize: 13, color: C.soft, borderBottom: `1px solid ${C.border}` }}>{l.callsThrough || l.assigned}</td>
                                <td style={{ padding: "12px 14px", fontSize: 13, color: C.soft, borderBottom: `1px solid ${C.border}` }}>{l.delivered}</td>
                                <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
                                  <span style={{ background: tierColor(l.commission?.tier || "none") + "18", color: tierColor(l.commission?.tier || "none"), borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{l.commission?.rate || 0}%</span>
                                </td>
                                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: tierColor(l.commission?.tier || "none"), borderBottom: `1px solid ${C.border}` }}>{fmtNaira(l.commission?.total || 0)}</td>
                                <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
                                  <span style={{ background: (l.status === "approved" ? C.green : l.status === "rejected" ? C.red : C.yellow) + "18", color: l.status === "approved" ? C.green : l.status === "rejected" ? C.red : C.yellow, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
                                    {l.status === "approved" ? "✅ Approved" : l.status === "rejected" ? "❌ Rejected" : "⏳ Pending"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
              }
            </div>
          )}

          {tab === "noanswer" && teamType !== "socialmedia" && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4, letterSpacing: "-0.02em" }}>📵 Log No-Answer</div>
              <NoAnswerForm user={user} onSaved={async () => { await refresh(); setSaved("noanswer"); setTimeout(() => setSaved(""), 3000); }} />
            </div>
          )}

          {tab === "history" && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 16, letterSpacing: "-0.02em" }}>🕐 My Call History</div>
              <PeriodTabs />
              {myReports.length === 0
                ? <div style={{ background: C.card, border: `1px dashed ${C.border}`, borderRadius: 8, padding: 48, textAlign: "center", color: "#4b4b4e" }}>No calls in this period.</div>
                : myReports.map((r: any) => <RecentCallRow key={r.id} r={r} />)
              }
            </div>
          )}

          {tab === "attendance" && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4, letterSpacing: "-0.02em" }}>📅 My Attendance</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Every approved log = present day</div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, textAlign: "center", color: C.muted }}>
                Attendance calendar coming soon
              </div>
            </div>
          )}

          {tab === "leaderboard" && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4, letterSpacing: "-0.02em" }}>🏆 Leaderboard</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>See where your team ranks</div>
              <PeriodTabs />
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 40, textAlign: "center", color: C.muted }}>
                Leaderboard coming soon
              </div>
            </div>
          )}

          {tab === "summary" && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4, letterSpacing: "-0.02em" }}>✨ AI Summary Report</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>AI-powered analysis of your call performance</div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 40, textAlign: "center", color: C.muted }}>
                AI Summary coming soon
              </div>
            </div>
          )}
        </main>
      </div>

      {viewReport && <ReportModal report={viewReport} onClose={() => setViewReport(null)} />}
      {showChangePin && <ChangePinModal user={user} onClose={() => setShowChangePin(false)} refresh={refresh} saveUsersData={saveUsersData} allUsers={users} />}
      {showOnboarding && <OnboardingModal user={user} onClose={closeOnboarding} />}
    </div>
  );
}

export default CloserPortal;
