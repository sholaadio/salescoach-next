"use client";
import React, { useState } from "react";
import { initials, accent } from "../../lib/utils";
import { ROLE_LABELS } from "../../lib/constants";

export const PinPad = ({ users, onSuccess }: { users: Record<string, any>; onSuccess: (user: any) => void }) => {
  const [step, setStep] = useState<"id"|"pin">("id");
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [matched, setMatched] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleIdSubmit = () => {
    const found = Object.values(users).find((u: any) => u.employeeId?.toUpperCase() === employeeId.trim().toUpperCase());
    if (!found) { setError("Employee ID not found"); return; }
    setMatched(found); setError(""); setStep("pin");
  };

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next !== matched?.pin) { setTimeout(() => { setPin(""); setError("Incorrect PIN"); }, 300); }
      else { setLoading(true); onSuccess(matched); }
    }
  };

  const accentColor = matched ? accent(matched.role) : "#3B82F6";

  return (
    <div style={{ minHeight:"100vh", background:"#09090B", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#F97316,#EA580C)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <h1 style={{ color:"#F9FAFB", fontSize:20, fontWeight:700, margin:0 }}>SalesCoach</h1>
          <p style={{ color:"#6B7280", fontSize:13, margin:"4px 0 0" }}>Shoppyrex</p>
        </div>
        <div style={{ background:"#121214", border:"1px solid #1F2937", borderRadius:16, padding:24 }}>
          {step === "id" ? (
            <div>
              <h2 style={{ color:"#F9FAFB", fontSize:16, fontWeight:600, margin:"0 0 4px" }}>Welcome back</h2>
              <p style={{ color:"#9CA3AF", fontSize:13, margin:"0 0 20px" }}>Enter your employee ID</p>
              <input style={{ width:"100%", background:"#18181B", border:"1px solid #1F2937", borderRadius:8, padding:"10px 12px", color:"#F9FAFB", fontSize:14, outline:"none", boxSizing:"border-box", letterSpacing:2, textTransform:"uppercase" }} placeholder="e.g. SC001 or MGT001" value={employeeId} onChange={e => { setEmployeeId(e.target.value.toUpperCase()); setError(""); }} onKeyDown={e => e.key === "Enter" && handleIdSubmit()} />
              {error && <p style={{ color:"#EF4444", fontSize:12, margin:"6px 0 0" }}>{error}</p>}
              <button onClick={handleIdSubmit} disabled={!employeeId.trim()} style={{ width:"100%", marginTop:16, padding:"11px", background:"#3B82F6", color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}>Continue →</button>
            </div>
          ) : (
            <div>
              {matched && (
                <div style={{ display:"flex", alignItems:"center", gap:10, background:"#18181B", borderRadius:10, padding:"10px 12px", marginBottom:16 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:`${accentColor}22`, color:accentColor, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, flexShrink:0 }}>{initials(matched.name)}</div>
                  <div><div style={{ color:"#F9FAFB", fontSize:13, fontWeight:600 }}>{matched.name}</div><div style={{ color:"#6B7280", fontSize:11 }}>{ROLE_LABELS[matched.role as keyof typeof ROLE_LABELS]}</div></div>
                </div>
              )}
              <p style={{ color:"#9CA3AF", fontSize:13, textAlign:"center", margin:"0 0 4px" }}>Enter your 4-digit PIN</p>
              <div style={{ display:"flex", gap:10, justifyContent:"center", margin:"16px 0" }}>
                {[0,1,2,3].map(i => <div key={i} style={{ width:12, height:12, borderRadius:"50%", background:i < pin.length ? accentColor : "transparent", border:`2px solid ${i < pin.length ? accentColor : "#374151"}`, transition:"all 0.15s" }} />)}
              </div>
              {error && <p style={{ color:"#EF4444", fontSize:12, textAlign:"center", margin:"0 0 12px" }}>{error}</p>}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                {["1","2","3","4","5","6","7","8","9"].map(d => (
                  <button key={d} onClick={() => handleDigit(d)} style={{ height:56, background:"#1C1C1F", border:"1px solid #1F2937", borderRadius:10, color:"#F9FAFB", fontSize:18, fontWeight:600, cursor:"pointer" }}>{d}</button>
                ))}
                <button onClick={() => { setStep("id"); setPin(""); setError(""); setMatched(null); }} style={{ height:56, background:"transparent", border:"none", color:"#6B7280", fontSize:12, cursor:"pointer" }}>← Back</button>
                <button onClick={() => handleDigit("0")} style={{ height:56, background:"#1C1C1F", border:"1px solid #1F2937", borderRadius:10, color:"#F9FAFB", fontSize:18, fontWeight:600, cursor:"pointer" }}>0</button>
                <button onClick={() => setPin(p => p.slice(0,-1))} style={{ height:56, background:"#1C1C1F", border:"1px solid #1F2937", borderRadius:10, color:"#EF4444", fontSize:18, cursor:"pointer" }}>⌫</button>
              </div>
              {loading && <p style={{ color:"#6B7280", fontSize:12, textAlign:"center", marginTop:12 }}>Signing in...</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
