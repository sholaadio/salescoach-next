"use client";
/* eslint-disable */
import React, { useState } from "react";
import { saveDailyLog, saveGoal as saveGoal_api } from "@/lib/api";
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
const DARK: any = { bg: "#07080F", card: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)", text: "#F1F5FF", soft: "#C8D3E8", muted: "#6A7A90", green: "#00E5A0", yellow: "#FBBF24", red: "#FF6B6B", orange: "#F97316", navBg: "rgba(6,10,18,0.97)", surface: "rgba(255,255,255,0.03)", blue: "#60A5FA", purple: "#A78BFA", pink: "#F472B6" };
const LIGHT: any = { bg: "#F0F4FF", card: "rgba(255,255,255,0.9)", border: "rgba(0,0,0,0.08)", text: "#0A0E1A", soft: "#1E293B", muted: "#64748B", green: "#059669", yellow: "#D97706", red: "#DC2626", orange: "#EA580C", navBg: "rgba(255,255,255,0.97)", surface: "rgba(0,0,0,0.02)", blue: "#2563EB", purple: "#7C3AED", pink: "#DB2777" };
const C = () => { try { return typeof localStorage !== "undefined" && localStorage.getItem("sc_theme") === "light" ? LIGHT : DARK; } catch { return DARK; } };

function filterByPeriod(items: any[], field: string, period: string) {
  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
  return items.filter(i => { const d = new Date(i[field]); if (period === "today") return i[field] === todayStr(); if (period === "week") { const s = new Date(now); s.setDate(now.getDate()-6); return d >= s; } if (period === "month") return d.getFullYear() === y && d.getMonth() === m; if (period === "year") return d.getFullYear() === y; return true; });
}
function filterLogsByPeriod(logs: any[], period: string) { return filterByPeriod(logs, "date", period); }
function getWeeklyRate(logs: any[], closerId: string) {
  const now = new Date(); const s = new Date(now); s.setDate(now.getDate()-6);
  const wl = logs.filter(l => l.closerId === closerId && l.status === "approved" && new Date(l.date) >= s);
  if (wl.length === 0) return null;
  const tot = wl.reduce((s: number, l: any) => s + (+(l.callsThrough || l.assigned) || 0), 0);
  const del = wl.reduce((s: number, l: any) => s + (+l.delivered || 0), 0);
  return tot > 0 ? Math.round(del/tot*100) : null;
}
function calcSalesCommission(assigned: number, delivered: number, upsells=0, repeats=0, referrals=0) {
  const a = Math.max(+assigned||0,0); const d = +delivered||0; if (a===0) return { rate:0,total:0,tier:"none",upsellLocked:false,perOrder:0,base:0,upsellBonus:0,repeatBonus:0,referralBonus:0 };
  const rate = d/a*100; let perOrder=0; let tier="none";
  if (rate>=90){perOrder=200;tier="gold";}else if(rate>=65){perOrder=150;tier="silver";}else if(rate>=50){perOrder=100;tier="bronze";}
  const base=d*perOrder; const upsellLocked=rate<50; const upsellBonus=upsellLocked?0:(+upsells||0)*600; const repeatBonus=(+repeats||0)*300; const referralBonus=(+referrals||0)*300;
  return { rate:Math.round(rate),perOrder,base,upsellBonus,repeatBonus,referralBonus,total:base+upsellBonus+repeatBonus+referralBonus,tier,upsellLocked };
}

function ThemeToggle() {
  const [isDark,setIsDark] = useState(()=>{ try{return typeof localStorage!=="undefined"&&localStorage.getItem("sc_theme")!=="light";}catch{return true;} });
  const toggle=()=>{const n=!isDark;setIsDark(n);try{localStorage.setItem("sc_theme",n?"dark":"light");window.location.reload();}catch{}};
  return <button onClick={toggle} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"4px 10px",color:"#6A7A90",cursor:"pointer",fontSize:14}}>{isDark?"☀️":"🌙"}</button>;
}
function PeriodFilter({value,onChange}:{value:string;onChange:(v:string)=>void}) {
  const t=C(); return <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{[["today","Today"],["week","Week"],["month","Month"],["year","Year"],["all","All Time"]].map(([v,l])=><button key={v} onClick={()=>onChange(v)} style={{background:value===v?"rgba(249,115,22,0.15)":t.card,color:value===v?"#F97316":t.muted,border:`1px solid ${value===v?"rgba(249,115,22,0.35)":t.border}`,borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:value===v?700:500,cursor:"pointer"}}>{l}</button>)}</div>;
}
function ReportModal({report,onClose}:{report:any;onClose:()=>void}) {
  const t=C(); const a=report.analysis||{};
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
    <div style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:16,padding:28,maxWidth:600,width:"100%",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
        <div><div style={{fontSize:16,fontWeight:800}}>{report.product||"General"} · {report.callType==="whatsapp"?"💬":"📞"}</div><div style={{fontSize:12,color:t.muted}}>{fmtDate(report.date)} · {report.closerName}</div></div>
        <button onClick={onClose} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:8,padding:"4px 12px",color:t.muted,cursor:"pointer"}}>✕</button>
      </div>
      {a.overallScore&&<div style={{fontSize:36,fontWeight:900,color:scoreColor(a.overallScore),marginBottom:12}}>{a.overallScore}<span style={{fontSize:14,color:t.muted}}>/100</span></div>}
      {a.verdict&&<div style={{fontSize:13,color:t.soft,marginBottom:16,lineHeight:1.6}}>{a.verdict}</div>}
      {a.strengths?.length>0&&<div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:t.green,marginBottom:6}}>✅ Strengths</div>{a.strengths.map((s:string,i:number)=><div key={i} style={{fontSize:12,color:t.soft,marginBottom:4,paddingLeft:12}}>· {s}</div>)}</div>}
      {a.weaknesses?.length>0&&<div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:t.red,marginBottom:6}}>⚠️ Weaknesses</div>{a.weaknesses.map((s:string,i:number)=><div key={i} style={{fontSize:12,color:t.soft,marginBottom:4,paddingLeft:12}}>· {s}</div>)}</div>}
    </div>
  </div>;
}
function ChangePinModal({user,onClose,saveUsersData,refresh,allUsers}:any) {
  const t=C(); const [cur,setCur]=useState(""); const [np,setNp]=useState(""); const [cp,setCp]=useState(""); const [err,setErr]=useState(""); const [ok,setOk]=useState(false);
  const save=async()=>{if(cur!==user.pin){setErr("Current PIN incorrect.");return;}if(np.length!==4){setErr("Must be 4 digits.");return;}if(np!==cp){setErr("PINs don't match.");return;}await saveUsersData({...allUsers,[user.id]:{...user,pin:np}});await refresh();setOk(true);setTimeout(onClose,1200);};
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
    <div style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:16,padding:28,width:320}} onClick={e=>e.stopPropagation()}>
      <div style={{fontSize:15,fontWeight:800,marginBottom:18}}>🔒 Change PIN</div>
      {ok?<div style={{color:t.green,textAlign:"center",padding:20}}>✅ PIN updated!</div>:<>
        {[["Current PIN",cur,setCur],["New PIN",np,setNp],["Confirm PIN",cp,setCp]].map(([l,v,s]:any)=><div key={l} style={{marginBottom:12}}><label style={{fontSize:11,color:t.muted,display:"block",marginBottom:4}}>{l}</label><input type="password" maxLength={4} value={v} onChange={e=>s(e.target.value.replace(/\D/g,"").slice(0,4))} style={{width:"100%",background:t.card,border:`1px solid ${t.border}`,borderRadius:8,padding:"10px 12px",color:t.text,fontSize:14,boxSizing:"border-box"}}/></div>)}
        {err&&<div style={{color:t.red,fontSize:12,marginBottom:10}}>{err}</div>}
        <button onClick={save} style={{width:"100%",background:"#F97316",border:"none",borderRadius:10,padding:"11px",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Update PIN</button>
      </>}
    </div>
  </div>;
}
function SalesDailyLogForm({user,onSaved,existingLog}:any) {
  const t=C(); const [f,setF]=useState({assigned:existingLog?.assigned||"",confirmed:existingLog?.confirmed||"",delivered:existingLog?.delivered||"",upsells:existingLog?.upsells||"0",repeats:existingLog?.repeats||"0",referrals:existingLog?.referrals||"0"}); const [saving,setSaving]=useState(false);
  const comm=calcSalesCommission(+f.assigned,+f.delivered,+f.upsells,+f.repeats,+f.referrals);
  const save=async()=>{if(!f.assigned||!f.delivered)return;setSaving(true);await onSaved({id:existingLog?.id||uid(),closerId:user.id,closerName:user.name,teamId:user.teamId,teamType:"sales",date:todayStr(),...f,commission:comm,status:"pending",createdAt:Date.now()});setSaving(false);};
  return <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:20,marginBottom:20}}>
    <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>📋 Today's Sales Log</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>{[["Assigned","assigned"],["Confirmed","confirmed"],["Delivered","delivered"],["Upsells","upsells"],["Repeats","repeats"],["Referrals","referrals"]].map(([l,k])=><div key={k}><label style={{fontSize:11,color:t.muted,display:"block",marginBottom:4}}>{l}</label><input type="number" min="0" value={(f as any)[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))} style={{width:"100%",background:t.bg,border:`1px solid ${t.border}`,borderRadius:8,padding:"8px 10px",color:t.text,fontSize:13,boxSizing:"border-box"}}/></div>)}</div>
    <div style={{background:`${tierColor(comm.tier)}11`,border:`1px solid ${tierColor(comm.tier)}33`,borderRadius:10,padding:"10px 14px",marginBottom:12}}><div style={{fontSize:11,color:t.muted}}>Commission Preview</div><div style={{fontSize:22,fontWeight:900,color:tierColor(comm.tier)}}>{fmtNaira(comm.total)}</div><div style={{fontSize:11,color:t.muted}}>{comm.rate}% · {comm.tier} tier</div></div>
    <button onClick={save} disabled={saving||!f.assigned||!f.delivered} style={{background:"#F97316",border:"none",borderRadius:10,padding:"10px 20px",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",opacity:!f.assigned||!f.delivered?0.5:1}}>{saving?"Saving...":existingLog?"✏️ Update":"✅ Submit"}</button>
  </div>;
}
function FollowupDailyLogForm({user,onSaved,existingLog}:any) {
  const t=C(); const [f,setF]=useState({callsMade:existingLog?.callsMade||"",callsThrough:existingLog?.callsThrough||"",delivered:existingLog?.delivered||"",upsells:existingLog?.upsells||"0",repeats:existingLog?.repeats||"0",referrals:existingLog?.referrals||"0"}); const [saving,setSaving]=useState(false);
  const save=async()=>{if(!f.callsThrough||!f.delivered)return;setSaving(true);await onSaved({id:existingLog?.id||uid(),closerId:user.id,closerName:user.name,teamId:user.teamId,teamType:"followup",date:todayStr(),...f,status:"pending",createdAt:Date.now()});setSaving(false);};
  return <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:20,marginBottom:20}}>
    <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>📋 Today's Follow-up Log</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>{[["Calls Made","callsMade"],["Went Through","callsThrough"],["Delivered","delivered"],["Upsells","upsells"],["Repeats","repeats"],["Referrals","referrals"]].map(([l,k])=><div key={k}><label style={{fontSize:11,color:t.muted,display:"block",marginBottom:4}}>{l}</label><input type="number" min="0" value={(f as any)[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))} style={{width:"100%",background:t.bg,border:`1px solid ${t.border}`,borderRadius:8,padding:"8px 10px",color:t.text,fontSize:13,boxSizing:"border-box"}}/></div>)}</div>
    <button onClick={save} disabled={saving} style={{background:"#F97316",border:"none",borderRadius:10,padding:"10px 20px",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>{saving?"Saving...":existingLog?"✏️ Update":"✅ Submit"}</button>
  </div>;
}
function SocialMediaTeamLogForm({user,users,existingLog,onSaved}:any) {
  const t=C(); const [f,setF]=useState({leadsContacted:existingLog?.leadsContacted||"",leadsConfirmed:existingLog?.leadsConfirmed||"",delivered:existingLog?.delivered||"",upsells:existingLog?.upsells||"0"}); const [saving,setSaving]=useState(false);
  const memberCount=Object.values(users as UserMap).filter((u:any)=>u.teamId===user.teamId&&["closer","teamlead"].includes(u.role)).length;
  const save=async()=>{if(!f.delivered)return;setSaving(true);await onSaved({id:existingLog?.id||uid(),closerId:user.id,closerName:user.name,teamId:user.teamId,teamType:"socialmedia",date:todayStr(),...f,memberCount,status:"approved",createdAt:Date.now()});setSaving(false);};
  return <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:20,marginBottom:20}}>
    <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>📱 Today's Team Log ({memberCount} members)</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:14}}>{[["Leads Contacted","leadsContacted"],["Leads Confirmed","leadsConfirmed"],["Delivered","delivered"],["Upsells","upsells"]].map(([l,k])=><div key={k}><label style={{fontSize:11,color:t.muted,display:"block",marginBottom:4}}>{l}</label><input type="number" min="0" value={(f as any)[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))} style={{width:"100%",background:t.bg,border:`1px solid ${t.border}`,borderRadius:8,padding:"8px 10px",color:t.text,fontSize:13,boxSizing:"border-box"}}/></div>)}</div>
    <button onClick={save} disabled={saving} style={{background:"#F97316",border:"none",borderRadius:10,padding:"10px 20px",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>{saving?"Saving...":existingLog?"✏️ Update":"✅ Submit"}</button>
  </div>;
}
function DailyReminderBanner({allLogs,userId,onLogNow}:any) {
  const t=C(); const today=allLogs.find((l:any)=>l.closerId===userId&&l.date===todayStr()); if(today)return null;
  return <div style={{background:"rgba(249,115,22,0.08)",border:"1px solid rgba(249,115,22,0.2)",borderRadius:10,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
    <span style={{fontSize:13,color:"#F97316"}}>⏰ You haven't submitted today's log yet.</span>
    <button onClick={onLogNow} style={{background:"#F97316",border:"none",borderRadius:8,padding:"5px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Log Now</button>
  </div>;
}
function AttendanceCalendar({userId,allLogs,userName}:any) {
  const t=C(); const now=new Date(); const y=now.getFullYear(); const m=now.getMonth(); const dim=new Date(y,m+1,0).getDate();
  const approved=new Set(allLogs.filter((l:any)=>l.closerId===userId&&l.status==="approved"&&new Date(l.date).getMonth()===m&&new Date(l.date).getFullYear()===y).map((l:any)=>new Date(l.date).getDate()));
  return <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:20,marginBottom:16}}>
    <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>{userName} — {now.toLocaleString("en",{month:"long",year:"numeric"})} ({approved.size}/{dim} days)</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{Array.from({length:dim},(_,i)=>i+1).map(d=><div key={d} style={{width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,background:approved.has(d)?"rgba(0,229,160,0.15)":t.surface,color:approved.has(d)?t.green:t.muted,border:`1px solid ${approved.has(d)?"rgba(0,229,160,0.3)":t.border}`}}>{d}</div>)}</div>
  </div>;
}

interface PortalProps { user:User; users:UserMap; teams:TeamMap; allReports:CallReport[]; allLogs:DailyLog[]; allNoAnswers:NoAnswerRecord[]; goals:Goal[]; onLogout:()=>void; refresh:()=>Promise<void>; saveUsersData:(u:UserMap)=>Promise<void>; }

export function TeamLeadPortal({user,users,teams,allReports,allLogs,allNoAnswers,goals,onLogout,refresh,saveUsersData}:PortalProps) {
  const t=C();
  const [showChangePin,setShowChangePin]=useState(false);
  const [tab,setTab]=useState("team");
  const [period,setPeriod]=useState("month");
  const [viewReport,setViewReport]=useState<any>(null);
  const [msg,setMsg]=useState("");
  const myTeam=teams?.[user?.teamId]??null;
  const teamType=myTeam?.type||"sales";
  const myMembers=Object.values(users).filter((u:any)=>u.teamId===user.teamId&&u.role==="closer");
  const teamReports=allReports.filter(r=>r.teamId===user.teamId);
  const teamLogs=allLogs.filter(l=>l.teamId===user.teamId);
  const pendingLogs=teamLogs.filter(l=>l.status==="pending");
  const myTodayLog=allLogs.find(l=>l.closerId===user.id&&l.date===todayStr());
  const teamTodayLog=teamType==="socialmedia"?allLogs.find(l=>l.teamId===user.teamId&&l.date===todayStr()):null;
  const flash=(m:string)=>{setMsg(m);setTimeout(()=>setMsg(""),2500);};
  const approveLog=async(log:any,approved:boolean)=>{const u={...log,status:approved?"approved":"rejected",approvedBy:user.id,approvedAt:Date.now()};await saveDailyLog(u);await refresh();flash(approved?"✅ Approved!":"❌ Rejected.");};
  const memberStats=myMembers.map(m=>{
    const reports=allReports.filter(r=>r.closerId===m.id);
    const logs=allLogs.filter(l=>l.closerId===m.id);
    const fl=filterLogsByPeriod(logs.filter(l=>l.status==="approved"),period);
    const pa=fl.reduce((s:number,l:any)=>s+(+(l.callsThrough||l.assigned)||0),0);
    const pd=fl.reduce((s:number,l:any)=>s+(+l.delivered||0),0);
    const periodRate=pa>0?Math.round(pd/pa*100):0;
    const avgScore=reports.length>0?Math.round(reports.reduce((s,r)=>s+(r.analysis?.overallScore||0),0)/reports.length):0;
    const weekRate=getWeeklyRate(allLogs,m.id);
    const todayLog=logs.find(l=>l.date===todayStr());
    return{...m,reports,avgScore,periodRate,weekRate,todayLog};
  });
  const pill=(c:string)=>({background:`${c}22`,color:c,border:`1px solid ${c}44`,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:600});
  const card={background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:20,marginBottom:16};
  const accentTop=(c:string)=>({position:"absolute" as const,top:0,left:0,right:0,height:3,background:c,borderRadius:"12px 12px 0 0"});
  const nb=(id:string,lbl:string)=><button onClick={()=>setTab(id)} style={{background:tab===id?"rgba(249,115,22,0.15)":"transparent",color:tab===id?"#F97316":"rgba(255,255,255,0.45)",border:tab===id?"1px solid rgba(249,115,22,0.35)":"1px solid transparent",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:tab===id?700:500,cursor:"pointer",whiteSpace:"nowrap"}}>{lbl}</button>;

  return <div style={{minHeight:"100vh",background:t.bg,color:t.text,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
    <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:64,background:t.navBg,borderBottom:`1px solid ${t.border}`,position:"sticky",top:0,zIndex:100,backdropFilter:"blur(20px)",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#F97316,#EA580C)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div><div style={{fontSize:13,fontWeight:800}}>Shoppyrex SalesCoach</div><div style={{fontSize:9,color:t.green,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>{teamTypeIcon(teamType)} {myTeam?.name||"Team"} · Lead</div></div>
      </div>
      <div style={{display:"flex",gap:4,overflowX:"auto",scrollbarWidth:"none" as any}}>
        {nb("team","👥 My Team")}{nb("analyses","🧠 Analyses")}{nb("leaderboard","🏆 Leaderboard")}{nb("attendance","📅 Attendance")}{nb("goals","🎯 Goals")}{nb("summary","✨ AI Summary")}
        {teamType!=="socialmedia"&&nb("approve",pendingLogs.length>0?`⏳ Approvals (${pendingLogs.length})`:"⏳ Approvals")}
        {nb("mycalls","🎙️ My Calls")}{nb("mylog","📋 "+(teamType==="socialmedia"?"Team Log":"My Log"))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:700}}>{user.name}</div><div style={{fontSize:9,color:t.muted}}>Team Lead</div></div>
        <ThemeToggle/>
        <button onClick={()=>setShowChangePin(true)} style={{background:"rgba(249,115,22,0.1)",border:"1px solid rgba(249,115,22,0.3)",borderRadius:8,padding:"4px 10px",color:"#F97316",cursor:"pointer",fontSize:11}}>🔒 PIN</button>
        <button onClick={onLogout} style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${t.border}`,borderRadius:8,padding:"4px 10px",color:t.muted,cursor:"pointer",fontSize:11}}>Sign Out</button>
      </div>
    </nav>
    <main style={{width:"100%",maxWidth:1400,margin:"0 auto",padding:"24px 32px",position:"relative",zIndex:1}}>
      {msg&&<div style={{background:"rgba(0,229,160,0.1)",border:"1px solid rgba(0,229,160,0.2)",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:t.green}}>{msg}</div>}
      <DailyReminderBanner allLogs={allLogs} userId={user.id} onLogNow={()=>setTab("mylog")}/>

      {tab==="team"&&<div>
        <h1 style={{fontSize:22,fontWeight:900,marginBottom:4}}>{teamTypeIcon(teamType)} {myTeam?.name||"My Team"}</h1>
        <p style={{fontSize:13,color:t.muted,marginBottom:16}}>{myMembers.length} members</p>
        <PeriodFilter value={period} onChange={setPeriod}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:16}}>
          {[{l:"Team Calls",v:teamReports.length,c:t.green},{l:"Members",v:myMembers.length,c:t.green},{l:"Pending",v:pendingLogs.length,c:pendingLogs.length>0?t.yellow:t.green},{l:"Red Flags",v:memberStats.filter(m=>m.weekRate!==null&&(m.weekRate as number)<60).length,c:t.red}].map((s,i)=>
            <div key={i} style={{...card,position:"relative",overflow:"hidden",marginBottom:0}}><div style={accentTop(s.c)}/><div style={{fontSize:10,color:t.muted,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:700}}>{s.l}</div><div style={{fontSize:26,fontWeight:900,marginTop:6}}>{s.v}</div></div>
          )}
        </div>
        {memberStats.map((m:any)=><div key={m.id} style={{...card,position:"relative",overflow:"hidden"}}>
          <div style={accentTop(m.weekRate!==null&&m.weekRate<60?t.red:scoreColor(m.avgScore))}/>
          {m.weekRate!==null&&m.weekRate<60&&<div style={{background:"rgba(255,107,107,0.08)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:8,padding:"6px 12px",marginBottom:10,fontSize:12,color:t.red}}>🚨 Red Flag — {m.name.split(" ")[0]}'s weekly rate is {m.weekRate}%</div>}
          <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"flex-start"}}>
            <div style={{minWidth:180}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:36,height:36,borderRadius:9,background:"rgba(0,229,160,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:t.green}}>{m.name.split(" ").map((w:string)=>w[0]).join("").slice(0,2)}</div>
                <div><div style={{fontSize:13,fontWeight:700}}>{m.name}</div><div style={{fontSize:10,color:t.muted}}>{m.reports.length} calls</div></div>
              </div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                <span style={pill(scoreColor(m.avgScore))}>Score: {m.avgScore||"—"}</span>
                <span style={pill(m.periodRate>=90?t.green:m.periodRate>=50?t.yellow:t.red)}>{m.periodRate}%</span>
              </div>
            </div>
            <div style={{display:"flex",gap:10,flex:1,flexWrap:"wrap"}}>
              {[{l:"Today Log",v:m.todayLog?`${m.todayLog.callsThrough||m.todayLog.assigned||0} ${teamType==="followup"?"through":"assigned"}`:"Not logged",c:m.todayLog?t.green:t.red},{l:"This Week",v:m.weekRate!==null?`${m.weekRate}%`:"—",c:m.weekRate!==null?(m.weekRate as number)>=60?t.green:t.red:t.muted}].map(x=>
                <div key={x.l} style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"8px 12px",minWidth:110}}>
                  <div style={{fontSize:9,color:t.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{x.l}</div>
                  <div style={{fontSize:14,fontWeight:800,color:x.c}}>{x.v}</div>
                </div>
              )}
            </div>
          </div>
        </div>)}
      </div>}

      {tab==="analyses"&&<div>
        <h1 style={{fontSize:22,fontWeight:900,marginBottom:4}}>🧠 Team AI Analyses</h1>
        <PeriodFilter value={period} onChange={setPeriod}/>
        {myMembers.map((m:any)=>{
          const mR=filterByPeriod(allReports.filter(r=>r.closerId===m.id),"date",period).sort((a,b)=>b.date-a.date);
          const avg=mR.length>0?Math.round(mR.reduce((s,r)=>s+(r.analysis?.overallScore||0),0)/mR.length):0;
          return <div key={m.id} style={{...card,marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${t.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:9,background:"rgba(0,229,160,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:t.green}}>{m.name.split(" ").map((w:string)=>w[0]).join("").slice(0,2)}</div>
                <div><div style={{fontSize:14,fontWeight:700}}>{m.name}</div><div style={{fontSize:11,color:t.muted}}>{mR.length} calls this period</div></div>
              </div>
              <span style={pill(scoreColor(avg))}>Avg: {avg||"—"}/100</span>
            </div>
            {mR.length===0?<div style={{color:t.muted,fontSize:12}}>No calls this period.</div>:mR.map(r=>
              <div key={r.id} onClick={()=>setViewReport(r)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`,cursor:"pointer",flexWrap:"wrap",gap:8}}>
                <div><div style={{fontSize:12,fontWeight:600}}>{r.product||"General"} · {r.callType==="whatsapp"?"💬":"📞"} · {fmtDate(r.date)}</div><div style={{fontSize:11,color:t.muted}}>{r.analysis?.verdict?.slice(0,65)}...</div></div>
                <div style={{display:"flex",gap:7}}><span style={pill(scoreColor(r.analysis?.overallScore||0))}>{r.analysis?.overallScore}/100</span><span style={pill(outcomeColor(r.callOutcome))}>{outcomeLabel(r.callOutcome)}</span></div>
              </div>
            )}
          </div>;
        })}
      </div>}

      {tab==="approve"&&teamType!=="socialmedia"&&<div>
        <h1 style={{fontSize:22,fontWeight:900,marginBottom:16}}>⏳ Pending Approvals</h1>
        {pendingLogs.length===0?<div style={{...card,textAlign:"center",padding:"40px",color:t.muted}}>✅ No pending approvals!</div>:pendingLogs.map(log=>{
          const comm=(log as any).commission;
          return <div key={log.id} style={{...card,position:"relative",overflow:"hidden"}}>
            <div style={accentTop(t.yellow)}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>{log.closerName} — {log.date}</div>
                <div style={{display:"flex",gap:16,fontSize:12,color:t.muted,flexWrap:"wrap"}}>
                  <span>Assigned: <strong style={{color:t.text}}>{(log as any).assigned||(log as any).callsThrough||0}</strong></span>
                  <span>Delivered: <strong style={{color:t.text}}>{(log as any).delivered||0}</strong></span>
                  {(log as any).upsells>0&&<span>Upsells: <strong style={{color:t.green}}>{(log as any).upsells}</strong></span>}
                </div>
                {comm?.upsellLocked&&<div style={{marginTop:4,fontSize:11,color:t.red}}>🔒 Upsell locked</div>}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{textAlign:"right",marginRight:8}}>
                  <div style={{fontSize:11,color:t.muted}}>Commission</div>
                  <div style={{fontSize:20,fontWeight:900,color:tierColor(comm?.tier||"none")}}>{fmtNaira(comm?.total||0)}</div>
                  <span style={pill(tierColor(comm?.tier||"none"))}>{comm?.rate||0}%</span>
                </div>
                <button style={{background:"#F97316",border:"none",borderRadius:10,padding:"8px 16px",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}} onClick={()=>approveLog(log,true)}>✅ Approve</button>
                <button style={{background:"rgba(255,107,107,0.15)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:10,padding:"8px 16px",color:"#FF6B6B",fontWeight:700,fontSize:13,cursor:"pointer"}} onClick={()=>approveLog(log,false)}>❌ Reject</button>
              </div>
            </div>
          </div>;
        })}
      </div>}

      {tab==="mycalls"&&<div>
        <h1 style={{fontSize:22,fontWeight:900,marginBottom:16}}>🎙️ My Own Calls</h1>
        <PeriodFilter value={period} onChange={setPeriod}/>
        {filterByPeriod(allReports.filter(r=>r.closerId===user.id),"date",period).length===0?<div style={{...card,textAlign:"center",padding:"40px",color:t.muted}}>No calls this period.</div>:
          filterByPeriod(allReports.filter(r=>r.closerId===user.id),"date",period).map(r=>
            <div key={r.id} style={{...card,cursor:"pointer",position:"relative",overflow:"hidden"}} onClick={()=>setViewReport(r)}>
              <div style={accentTop(scoreColor(r.analysis?.overallScore||0))}/>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div><div style={{fontWeight:700}}>{r.product||"General"} · {r.callType==="whatsapp"?"💬":"📞"}</div><div style={{fontSize:11,color:t.muted}}>{fmtDate(r.date)}</div></div>
                <div style={{display:"flex",gap:8}}><span style={pill(scoreColor(r.analysis?.overallScore||0))}>{r.analysis?.overallScore}/100</span><span style={pill(outcomeColor(r.callOutcome))}>{outcomeLabel(r.callOutcome)}</span></div>
              </div>
            </div>
          )
        }
      </div>}

      {tab==="mylog"&&<div>
        <h1 style={{fontSize:22,fontWeight:900,marginBottom:16}}>📋 {teamType==="socialmedia"?"Team Daily Log":"My Daily Log"}</h1>
        {teamType==="socialmedia"?<SocialMediaTeamLogForm user={user} users={users} existingLog={teamTodayLog} onSaved={async(log:any)=>{await saveDailyLog({...log,status:"approved"});await refresh();flash("✅ Team log saved!");}}/>
        :teamType==="followup"?<FollowupDailyLogForm user={user} existingLog={myTodayLog} onSaved={async(log:any)=>{await saveDailyLog({...log,status:"approved",approvedBy:user.id,approvedAt:Date.now()});await refresh();flash("✅ Auto-approved!");}}/>
        :<SalesDailyLogForm user={user} existingLog={myTodayLog} onSaved={async(log:any)=>{await saveDailyLog({...log,status:"approved",approvedBy:user.id,approvedAt:Date.now()});await refresh();flash("✅ Auto-approved!");}}/>}
      </div>}

      {tab==="leaderboard"&&<div>
        <h1 style={{fontSize:22,fontWeight:900,marginBottom:4}}>🏆 Team Leaderboard</h1>
        <PeriodFilter value={period} onChange={setPeriod}/>
        <div style={card}>
          {myMembers.length===0?<div style={{textAlign:"center",color:t.muted,padding:20}}>No team members yet.</div>:
            [...myMembers].sort((a:any,b:any)=>{
              const rate=(m:any)=>{const l=filterLogsByPeriod(allLogs.filter(x=>x.closerId===m.id&&x.status==="approved"),period);const tot=l.reduce((s:number,x:any)=>s+(+(x.callsThrough||x.assigned)||0),0);const del=l.reduce((s:number,x:any)=>s+(+x.delivered||0),0);return tot>0?Math.round(del/tot*100):0;};
              return rate(b)-rate(a);
            }).map((m:any,i:number)=>{
              const l=filterLogsByPeriod(allLogs.filter(x=>x.closerId===m.id&&x.status==="approved"),period);
              const tot=l.reduce((s:number,x:any)=>s+(+(x.callsThrough||x.assigned)||0),0);
              const del=l.reduce((s:number,x:any)=>s+(+x.delivered||0),0);
              const rate=tot>0?Math.round(del/tot*100):0;
              return <div key={m.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:i<myMembers.length-1?`1px solid ${t.border}`:"none"}}>
                <div style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{m.name}</div><div style={{fontSize:11,color:t.muted}}>{del} delivered · {tot} assigned</div></div>
                <span style={pill(rate>=90?t.green:rate>=65?t.yellow:rate>=50?"#F97316":t.red)}>{rate}%</span>
              </div>;
            })
          }
        </div>
      </div>}

      {tab==="attendance"&&<div>
        <h1 style={{fontSize:22,fontWeight:900,marginBottom:4}}>📅 Team Attendance</h1>
        <p style={{fontSize:13,color:t.muted,marginBottom:16}}>Each approved log = present day</p>
        {[user,...myMembers].map((m:any)=><AttendanceCalendar key={m.id} userId={m.id} allLogs={allLogs} userName={m.name}/>)}
      </div>}

      {tab==="goals"&&<div>
        <h1 style={{fontSize:22,fontWeight:900,marginBottom:16}}>🎯 Team Goals</h1>
        <div style={{...card,textAlign:"center",color:t.muted,padding:"40px"}}>Goal setting panel — coming soon with full implementation.</div>
      </div>}

      {tab==="summary"&&<div>
        <h1 style={{fontSize:22,fontWeight:900,marginBottom:4}}>✨ AI Summary Reports</h1>
        <div style={{...card,textAlign:"center",color:t.muted,padding:"40px"}}>AI Summary feature coming soon. Reports generated via Claude API.</div>
      </div>}
    </main>
    {viewReport&&<ReportModal report={viewReport} onClose={()=>setViewReport(null)}/>}
    {showChangePin&&<ChangePinModal user={user} onClose={()=>setShowChangePin(false)} refresh={refresh} saveUsersData={saveUsersData} allUsers={users}/>}
  </div>;
}
