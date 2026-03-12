"use client";
import { useState, useEffect } from "react";
import { PinPad } from "../src/components/portals/PinPad";
import { getUsers, getTeams, getReports, getDailyLogs, getNoAnswers, getGoals, seedIfEmpty } from "../src/lib/api";
import { SEED_USERS, SEED_TEAMS } from "../src/lib/constants";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState({ users: SEED_USERS as any, teams: SEED_TEAMS as any, allReports: [] as any[], allLogs: [] as any[], allNoAnswers: [] as any[], goals: [] as any[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { await seedIfEmpty(); } catch(e) {}
      const [u, t, r, l, n, g] = await Promise.all([getUsers(), getTeams(), getReports(), getDailyLogs(), getNoAnswers(), getGoals()]);
      setData({ users: u as any, teams: t as any, allReports: r as any[], allLogs: l as any[], allNoAnswers: n as any[], goals: g as any[] });
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#09090B", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#F97316,#EA580C)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <p style={{ color:"#6B7280", fontSize:14 }}>Loading SalesCoach...</p>
      </div>
    </div>
  );

  if (!user) return <PinPad users={data.users} onSuccess={setUser} />;

  return (
    <div style={{ minHeight:"100vh", background:"#09090B", color:"#F9FAFB", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <h1 style={{ fontSize:24, fontWeight:700 }}>Welcome, {user.name} 👋</h1>
        <p style={{ color:"#6B7280", marginTop:8 }}>Role: {user.role} · {user.employeeId}</p>
        <button onClick={() => setUser(null)} style={{ marginTop:24, padding:"10px 20px", background:"#1C1C1F", border:"1px solid #1F2937", borderRadius:8, color:"#9CA3AF", cursor:"pointer" }}>Sign out</button>
      </div>
    </div>
  );
}
