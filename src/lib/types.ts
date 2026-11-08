export type Watcher = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
};

export type Template = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
  days: number[];
};

export type Assignment = {
  id: string;
  weekStart: string;
  dayOfWeek: number;
  templateId: string;
  watcherId: string;
};

export type Invite = {
  id: string;
  token: string;
  watcherId: string | null;
  usedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
};

export type Member = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  watcherId: string | null;
};

export type AppState = {
  me: Member;
  watchers: Watcher[];
  templates: Template[];
  assignments: Assignment[];
  invites: Invite[];
  members: Member[];
  weekStart: string;
  googleConfigured: boolean;
  authMode: "google" | "local-mock";
};
