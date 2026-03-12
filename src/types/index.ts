export type UserRole = "ceo" | "gm" | "head_sales" | "head_creative" | "hr" | "teamlead" | "closer";
export type TeamType = "sales" | "followup" | "socialmedia";
export type CommTier = "gold" | "silver" | "bronze" | "none" | "flat";
export type Period = "day" | "week" | "month" | "year" | "all";
export type LogStatus = "pending" | "approved" | "rejected";
export type CallOutcome = "confirmed" | "cancelled" | "followup" | "switchedoff" | "callback" | "noanswer" | "notinterested";
export interface User { id: string; name: string; employeeId: string; pin: string; role: UserRole; teamId: string | null; perms?: { manageRoles?: boolean; resetPins?: boolean; generateSummary?: boolean; }; }
export type UserMap = Record<string, User>;
export interface Team { id: string; name: string; leadId: string; type: TeamType; }
export type TeamMap = Record<string, Team>;
export interface Commission { rate?: number; perOrder?: number; base: number; upsellBonus: number; repeatBonus: number; referralBonus: number; total: number; tier?: CommTier; upsellLocked?: boolean; totalPool?: number; perMember?: number; memberCount?: number; }
export interface DailyLog { id: string; closerId: string; closerName: string; teamId: string; teamType: TeamType; date: string; status: LogStatus; assigned?: number; callsMade?: number; callsThrough?: number; delivered?: number; upsells?: number; repeats?: number; referrals?: number; leadsContacted?: number; leadsConfirmed?: number; memberCount?: number; commission?: Commission; approvedBy?: string; approvedAt?: number; }
export interface CallAnalysis { overallScore: number; topStrengths: string[]; criticalWeaknesses: string[]; keyInsight: string; actionPlan: string; motivationalNote: string; tomorrowFocus: string; }
export interface CallReport { id: string; closerId: string; closerName: string; teamId: string; teamType: TeamType; date: string; callType: string; callOutcome: CallOutcome; product: string; transcript: string; analysis: CallAnalysis; }
export interface Goal { id: string; type: string; targetId: string; metric: string; target: number; period: Period; createdBy: string; createdAt: string; }
export interface ResolvedPerms { manageRoles: boolean; resetPins: boolean; generateSummary: boolean; }
