import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const uid = () => Math.random().toString(36).slice(2, 9);
export const todayStr = () => new Date().toISOString().slice(0, 10);
export const fmtDate = (d: string | number) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
export const fmtNaira = (n: number | string | undefined) => `\u20A6${Number(n ?? 0).toLocaleString()}`;
export const initials = (name: string) => name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
export const accent = (role: string): string => ({ ceo: "#F59E0B", gm: "#3B82F6", head_sales: "#10B981", head_creative: "#8B5CF6", hr: "#EC4899", teamlead: "#F97316", closer: "#5E6AD2" } as Record<string,string>)[role] ?? "#3B82F6";
export const scoreColor = (s: number) => s >= 80 ? "#F97316" : s >= 60 ? "#F59E0B" : "#EF4444";
export const getPerms = (user: { role: string; perms?: { manageRoles?: boolean; resetPins?: boolean; generateSummary?: boolean } }) => {
  const r = user.role; const c = user.perms ?? {};
  return { manageRoles: c.manageRoles ?? (r === "ceo" || r === "gm"), resetPins: c.resetPins ?? (r === "ceo" || r === "gm" || r === "head_sales" || r === "hr"), generateSummary: c.generateSummary ?? (r === "ceo" || r === "gm" || r === "head_sales") };
};
export const filterByPeriod = (items: Record<string, unknown>[], field: string, period: string): Record<string, unknown>[] => {
  const now = new Date();
  return items.filter(item => {
    const d = new Date(item[field] as string);
    if (period === "day") return d.toDateString() === now.toDateString();
    if (period === "week") { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "year") return d.getFullYear() === now.getFullYear();
    return true;
  });
};
export const calcSalesCommission = (assigned: number, delivered: number, upsells = 0, repeats = 0, referrals = 0) => {
  const a = Math.max(+assigned || 0, 0); const d = +delivered || 0;
  if (a === 0) return { rate: 0, perOrder: 0, base: 0, upsellBonus: 0, repeatBonus: 0, referralBonus: 0, total: 0, tier: "none", upsellLocked: false };
  const rate = d / a * 100; let perOrder = 0; let tier = "none";
  if (rate >= 90) { perOrder = 200; tier = "gold"; } else if (rate >= 65) { perOrder = 150; tier = "silver"; } else if (rate >= 50) { perOrder = 100; tier = "bronze"; }
  const base = d * perOrder; const upsellLocked = rate < 50;
  const upsellBonus = upsellLocked ? 0 : (+upsells || 0) * 600;
  const repeatBonus = (+repeats || 0) * 300; const referralBonus = (+referrals || 0) * 300;
  return { rate: Math.round(rate), perOrder, base, upsellBonus, repeatBonus, referralBonus, total: base + upsellBonus + repeatBonus + referralBonus, tier, upsellLocked };
};
