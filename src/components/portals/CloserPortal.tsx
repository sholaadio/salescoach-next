"use client";
import { useState } from "react";
import { fmtNaira, calcSalesCommission, todayStr, uid } from "../../lib/utils";
import { saveDailyLog } from "../../lib/api";

const tabs = ["Dashboard", "Daily Log", "History"];

export const CloserPortal = ({ user, allLogs, onLogSaved }: { user: any; allLogs: any[]; onLogSaved: () => void }) => {
  const [tab, setTab] = useState("Dashboard");
  const myLogs = allLogs.filter((l: any) => l.closerId === user.id);
  const todayLog = myLogs.find((l: any) => l.date === todayStr());
  const comm = todayLog ? calcSalesCommission(todayLog.assigned ?? 0, todayLog.delivered ?? 0, todayLog.upsells ?? 0, todayLog.repeats ?? 0, todayLog.referrals ?? 0) : null;

  return (
    <div style={{ minHeight:"100vh", background:"#09090B", color:"#F9FAFB" }}>
      <div style={{ maxWidth:480, margin:"0 auto", padding:"0 16px 100px" }}>
        <div style={{ padding:"20px 0 8px", borderBottom:"1px solid #1F2937", marginBottom:20 }}>
          <p style={{ color:"#6B7280", fontSize:12, margin:0 }}>Signed in as</p>
          <h2 style={{ color:"#F9FAFB", fontSize:16, fontWeight:700, margin:"2px 0 0" }}>{user.name}</h2>
        </div>

        <div style={{ display:"flex", gap:4, background:"#121214", borderRadius:10, padding:4, marginBottom:24 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:"8px 4px", borderRadius:7, border:"none", background: tab===t ? "#1C1C1F" : "transparent", color: tab===t ? "#F9FAFB" : "#6B7280", fontSize:13, fontWeight: tab===t ? 600 : 400, cursor:"pointer" }}>{t}</button>
          ))}
        </div>

        {tab === "Dashboard" && <Dashboard user={user} todayLog={todayLog} comm={comm} myLogs={myLogs} />}
        {tab === "Daily Log" && <DailyLogForm user={user} todayLog={todayLog} onSaved={onLogSaved} />}
        {tab === "History" && <History myLogs={myLogs} />}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, color }: any) => (
  <div style={{ background:"#121214", border:"1px solid #1F2937", borderRadius:12, padding:"14px 16px" }}>
    <p style={{ color:"#6B7280", fontSize:11, margin:"0 0 4px", textTransform:"uppercase", letterSpacing:1 }}>{label}</p>
    <p style={{ color: color ?? "#F9FAFB", fontSize:22, fontWeight:700, margin:0 }}>{value}</p>
    {sub && <p style={{ color:"#6B7280", fontSize:11, margin:"4px 0 0" }}>{sub}</p>}
  </div>
);

const Dashboard = ({ user, todayLog, comm, myLogs }: any) => (
  <div>
    <h3 style={{ color:"#F9FAFB", fontSize:15, fontWeight:600, margin:"0 0 14px" }}>Today's Overview</h3>
    {!todayLog ? (
      <div style={{ background:"#121214", border:"1px solid #1F2937", borderRadius:12, padding:20, textAlign:"center" }}>
        <p style={{ color:"#6B7280", fontSize:14 }}>No log submitted today yet.</p>
        <p style={{ color:"#3B82F6", fontSize:13, marginTop:4 }}>Go to Daily Log to submit your numbers.</p>
      </div>
    ) : (
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        <StatCard label="Assigned" value={todayLog.assigned ?? 0} />
        <StatCard label="Delivered" value={todayLog.delivered ?? 0} />
        <StatCard label="Rate" value={`${comm?.rate ?? 0}%`} color={comm?.tier === "gold" ? "#F59E0B" : comm?.tier === "silver" ? "#9CA3AF" : comm?.tier === "bronze" ? "#F97316" : "#EF4444"} />
        <StatCard label="Commission" value={fmtNaira(comm?.total ?? 0)} color="#10B981" sub={comm?.tier ? `${comm.tier} tier` : undefined} />
        <StatCard label="Upsells" value={todayLog.upsells ?? 0} sub={comm?.upsellLocked ? "🔒 locked" : `+${fmtNaira(comm?.upsellBonus ?? 0)}`} />
        <StatCard label="Status" value={todayLog.status === "approved" ? "✅ Approved" : todayLog.status === "rejected" ? "❌ Rejected" : "⏳ Pending"} />
      </div>
    )}
    <h3 style={{ color:"#F9FAFB", fontSize:15, fontWeight:600, margin:"20px 0 14px" }}>All Time</h3>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
      <StatCard label="Total Logs" value={myLogs.length} />
      <StatCard label="Approved" value={myLogs.filter((l:any) => l.status==="approved").length} color="#10B981" />
    </div>
  </div>
);

const DailyLogForm = ({ user, todayLog, onSaved }: any) => {
  const [form, setForm] = useState({ assigned: todayLog?.assigned ?? "", delivered: todayLog?.delivered ?? "", upsells: todayLog?.upsells ?? "", repeats: todayLog?.repeats ?? "", referrals: todayLog?.referrals ?? "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const comm = calcSalesCommission(+form.assigned||0, +form.delivered||0, +form.upsells||0, +form.repeats||0, +form.referrals||0);

  const handleSave = async () => {
    setSaving(true);
    const log = { id: todayLog?.id ?? uid(), closerId: user.id, closerName: user.name, teamId: user.teamId, teamType: "sales", date: todayStr(), status: todayLog?.status ?? "pending", assigned: +form.assigned||0, delivered: +form.delivered||0, upsells: +form.upsells||0, repeats: +form.repeats||0, referrals: +form.referrals||0, commission: comm };
    await saveDailyLog(log);
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); onSaved(); }, 1500);
  };

  const Field = ({ label, k, hint }: any) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ color:"#9CA3AF", fontSize:12, display:"block", marginBottom:4 }}>{label}{hint && <span style={{ color:"#4B5563", marginLeft:4 }}>— {hint}</span>}</label>
      <input type="number" min="0" value={(form as any)[k]} onChange={e => set(k, e.target.value)} style={{ width:"100%", background:"#18181B", border:"1px solid #1F2937", borderRadius:8, padding:"10px 12px", color:"#F9FAFB", fontSize:15, outline:"none", boxSizing:"border-box" }} />
    </div>
  );

  return (
    <div>
      <h3 style={{ color:"#F9FAFB", fontSize:15, fontWeight:600, margin:"0 0 4px" }}>{todayLog ? "Update Today's Log" : "Submit Today's Log"}</h3>
      <p style={{ color:"#6B7280", fontSize:12, margin:"0 0 20px" }}>{todayStr()}</p>
      <Field label="Assigned Leads" k="assigned" />
      <Field label="Delivered" k="delivered" />
      <Field label="Upsells" k="upsells" hint="requires ≥50% rate" />
      <Field label="Repeat Customers" k="repeats" />
      <Field label="Referrals" k="referrals" />

      {+form.assigned > 0 && (
        <div style={{ background:"#121214", border:"1px solid #1F2937", borderRadius:10, padding:14, marginBottom:16 }}>
          <p style={{ color:"#6B7280", fontSize:11, margin:"0 0 8px", textTransform:"uppercase", letterSpacing:1 }}>Commission Preview</p>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ color:"#9CA3AF", fontSize:13 }}>{comm.rate}% rate · {comm.tier} tier</span>
            <span style={{ color:"#10B981", fontSize:18, fontWeight:700 }}>{fmtNaira(comm.total)}</span>
          </div>
          {comm.upsellLocked && <p style={{ color:"#EF4444", fontSize:11, margin:"6px 0 0" }}>⚠ Upsell bonus locked — need ≥50% delivery rate</p>}
        </div>
      )}

      <button onClick={handleSave} disabled={saving || saved || !form.assigned} style={{ width:"100%", padding:"13px", background: saved ? "#10B981" : "#3B82F6", color:"white", border:"none", borderRadius:10, fontSize:15, fontWeight:600, cursor:"pointer" }}>
        {saved ? "✓ Saved!" : saving ? "Saving..." : todayLog ? "Update Log" : "Submit Log"}
      </button>
    </div>
  );
};

const History = ({ myLogs }: any) => {
  const sorted = [...myLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <div>
      <h3 style={{ color:"#F9FAFB", fontSize:15, fontWeight:600, margin:"0 0 14px" }}>Log History</h3>
      {sorted.length === 0 ? <p style={{ color:"#6B7280", fontSize:14 }}>No logs yet.</p> : sorted.map((log: any) => {
        const c = log.commission ?? calcSalesCommission(log.assigned??0, log.delivered??0, log.upsells??0, log.repeats??0, log.referrals??0);
        return (
          <div key={log.id} style={{ background:"#121214", border:"1px solid #1F2937", borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ color:"#F9FAFB", fontSize:13, fontWeight:600 }}>{log.date}</span>
              <span style={{ color: log.status==="approved" ? "#10B981" : log.status==="rejected" ? "#EF4444" : "#F59E0B", fontSize:12 }}>{log.status}</span>
            </div>
            <div style={{ display:"flex", gap:16 }}>
              <span style={{ color:"#6B7280", fontSize:12 }}>{log.delivered}/{log.assigned} delivered</span>
              <span style={{ color:"#10B981", fontSize:12, fontWeight:600 }}>{fmtNaira(c.total)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
