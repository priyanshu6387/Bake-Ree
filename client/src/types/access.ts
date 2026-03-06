export type AccessPolicyEntry = {
  visible: boolean;
  locked: boolean;
};

export type NavPolicy = {
  modules: Record<string, AccessPolicyEntry>;
  pages: Record<string, AccessPolicyEntry>;
};

export type AccessContext = {
  id: string;
  role?: string;
  isAdmin?: boolean;
  accessRoleKey?: string | null;
  roleName?: string | null;
  permissions: string[];
  navPolicy: NavPolicy;
  settingsVersion: number;
};

export type AccessRole = {
  key: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
  isSystem: boolean;
  permissions: string[];
  navPolicy: NavPolicy;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type OpsSettingsPayload = {
  workflow: Record<string, unknown>;
  notifications: Record<string, unknown>;
  integrations: Record<string, unknown>;
  compliance: Record<string, unknown>;
  kitchen: Record<string, unknown>;
};
