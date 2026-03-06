import http from "@/services/http";
import type { AccessRole, OpsSettingsPayload } from "@/types/access";

export type SettingsBootstrap = {
  settingsVersion: number;
  coreTabs: string[];
  systemRolePresets: { key: string; name: string; description: string }[];
  roles: AccessRole[];
  settings: OpsSettingsPayload;
};

export const opsSettingsService = {
  async getBootstrap(): Promise<SettingsBootstrap> {
    const { data } = await http.get("/ops/settings/bootstrap");
    return data;
  },

  async listRoles(): Promise<AccessRole[]> {
    const { data } = await http.get("/ops/settings/roles");
    return data;
  },

  async createRole(payload: {
    key: string;
    name: string;
    description?: string;
    permissions?: string[];
    metadata?: Record<string, unknown>;
  }) {
    const { data } = await http.post("/ops/settings/roles", payload);
    return data;
  },

  async updateRole(
    roleKey: string,
    payload: {
      name?: string;
      description?: string;
      permissions?: string[];
      status?: "ACTIVE" | "INACTIVE";
      metadata?: Record<string, unknown>;
    }
  ) {
    const { data } = await http.patch(`/ops/settings/roles/${roleKey}`, payload);
    return data;
  },

  async getNavigation(roleKey: string) {
    const { data } = await http.get("/ops/settings/navigation", { params: { roleKey } });
    return data;
  },

  async updateNavigation(payload: {
    roleKey: string;
    modules: Record<string, { visible: boolean; locked: boolean }>;
    pages: Record<string, { visible: boolean; locked: boolean }>;
  }) {
    const { data } = await http.put("/ops/settings/navigation", payload);
    return data;
  },

  async getKitchenRbac() {
    const { data } = await http.get("/ops/settings/kitchen-rbac");
    return data as AccessRole[];
  },

  async updateKitchenRbac(payload: { roleKey: string; permissions: string[] }) {
    const { data } = await http.put("/ops/settings/kitchen-rbac", payload);
    return data;
  },

  async getSection(section: "workflow" | "notifications" | "integrations" | "compliance") {
    const { data } = await http.get(`/ops/settings/${section}`);
    return data as { section: string; value: Record<string, unknown>; settingsVersion: number };
  },

  async updateSection(
    section: "workflow" | "notifications" | "integrations" | "compliance",
    value: Record<string, unknown>
  ) {
    const { data } = await http.put(`/ops/settings/${section}`, { value });
    return data as { section: string; value: Record<string, unknown>; settingsVersion: number };
  },

  async listAudit(limit = 100) {
    const { data } = await http.get("/ops/settings/audit", { params: { limit } });
    return data;
  },
};
