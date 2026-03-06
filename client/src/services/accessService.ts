import http from "@/services/http";
import type { AccessContext } from "@/types/access";

const DEFAULT_CONTEXT: AccessContext = {
  id: "",
  role: undefined,
  isAdmin: false,
  accessRoleKey: null,
  roleName: null,
  permissions: [],
  navPolicy: {
    modules: {},
    pages: {},
  },
  settingsVersion: 1,
};

export const accessService = {
  async getContext(): Promise<AccessContext> {
    try {
      const { data } = await http.get("/auth/me");
      return {
        ...DEFAULT_CONTEXT,
        id: data?._id || data?.id || "",
        role: data?.role,
        isAdmin: data?.isAdmin,
        accessRoleKey: data?.accessRoleKey ?? null,
        roleName: data?.roleName ?? null,
        permissions: Array.isArray(data?.permissions) ? data.permissions : [],
        navPolicy: {
          modules: data?.navPolicy?.modules || {},
          pages: data?.navPolicy?.pages || {},
        },
        settingsVersion: Number(data?.settingsVersion || 1),
      };
    } catch (error) {
      // Keep UI usable when auth/access API is temporarily unavailable.
      console.error("Failed to load access context, using permissive fallback:", error);
      return { ...DEFAULT_CONTEXT };
    }
  },
};
