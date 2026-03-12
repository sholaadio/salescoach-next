export const SERVER = process.env.NEXT_PUBLIC_API_URL ?? "https://salescoach-server.onrender.com";
export const SEED_USERS = {
  ceo001: { id: "ceo001", name: "Mr Shola Adio", employeeId: "MGT001", pin: "0001", role: "ceo", teamId: null },
  gm001: { id: "gm001", name: "Mr Samuel Amuda", employeeId: "MGT002", pin: "0002", role: "gm", teamId: null },
  hos001: { id: "hos001", name: "Lady Victory Friday", employeeId: "MGT003", pin: "0003", role: "head_sales", teamId: null },
  hoc001: { id: "hoc001", name: "Mr Okoro Kennedy", employeeId: "MGT004", pin: "0004", role: "head_creative", teamId: null },
  hr001: { id: "hr001", name: "Lady Victoria", employeeId: "MGT005", pin: "0005", role: "hr", teamId: null },
  tl001: { id: "tl001", name: "Lady Abigail", employeeId: "TL001", pin: "1001", role: "teamlead", teamId: "team1" },
  tl002: { id: "tl002", name: "Lady Mary", employeeId: "TL002", pin: "1002", role: "teamlead", teamId: "team2" },
  tl003: { id: "tl003", name: "Lady Deborah", employeeId: "TL003", pin: "1003", role: "teamlead", teamId: "team3" },
  tl004: { id: "tl004", name: "Lady Tiwalade", employeeId: "TL004", pin: "1004", role: "teamlead", teamId: "team4" },
  tl005: { id: "tl005", name: "Mr Kelvin", employeeId: "TL005", pin: "1005", role: "teamlead", teamId: "team5" },
  c001: { id: "c001", name: "Chukwuemeka Obi", employeeId: "SC001", pin: "2001", role: "closer", teamId: "team1" },
  c002: { id: "c002", name: "Fatima Aliyu", employeeId: "SC002", pin: "2002", role: "closer", teamId: "team1" },
  c003: { id: "c003", name: "Segun Adeyemi", employeeId: "SC003", pin: "2003", role: "closer", teamId: "team2" },
  c004: { id: "c004", name: "Ngozi Eze", employeeId: "SC004", pin: "2004", role: "closer", teamId: "team2" },
  c005: { id: "c005", name: "Amaka Okonkwo", employeeId: "SC005", pin: "2005", role: "closer", teamId: "team3" },
  c006: { id: "c006", name: "Tunde Bakare", employeeId: "SC006", pin: "2006", role: "closer", teamId: "team3" },
  c007: { id: "c007", name: "Blessing Nwosu", employeeId: "SC007", pin: "2007", role: "closer", teamId: "team4" },
  c008: { id: "c008", name: "Emeka Eze", employeeId: "SC008", pin: "2008", role: "closer", teamId: "team4" },
};
export const SEED_TEAMS = {
  team1: { id: "team1", name: "Team Abigail", leadId: "tl001", type: "sales" },
  team2: { id: "team2", name: "Team Mary", leadId: "tl002", type: "sales" },
  team3: { id: "team3", name: "Team Deborah", leadId: "tl003", type: "sales" },
  team4: { id: "team4", name: "Follow-Up Team", leadId: "tl004", type: "followup" },
  team5: { id: "team5", name: "Social Media Team", leadId: "tl005", type: "socialmedia" },
};
export const ROLE_LABELS = { ceo: "CEO", gm: "General Manager", head_sales: "Head of Sales", head_creative: "Head of Creative", hr: "HR Manager", teamlead: "Team Leader", closer: "Sales Closer" };
