import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { MeResponse, PublicUser } from "@shared/types";
import { api, setCsrf } from "./api";

interface AuthValue {
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string, totp?: string) => Promise<PublicUser>;
  verifyMagic: (token: string) => Promise<PublicUser>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);
const ME_KEY = ["me"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const me = useQuery({
    queryKey: ME_KEY,
    staleTime: Infinity,
    queryFn: async () => {
      const r = await api<MeResponse>("/api/auth/me");
      setCsrf(r.csrfToken);
      return r;
    },
  });

  const apply = useCallback(
    (r: MeResponse) => {
      setCsrf(r.csrfToken);
      qc.setQueryData(ME_KEY, r);
      return r.user as PublicUser;
    },
    [qc],
  );

  const login = useCallback(
    async (email: string, password: string, totp?: string) =>
      apply(await api<MeResponse>("/api/auth/login", { method: "POST", body: { email, password, ...(totp ? { totp } : {}) } })),
    [apply],
  );

  const verifyMagic = useCallback(
    async (token: string) => apply(await api<MeResponse>("/api/auth/magic/verify", { method: "POST", body: { token } })),
    [apply],
  );

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    apply({ user: null, csrfToken: null });
  }, [apply]);

  const value = useMemo<AuthValue>(
    () => ({ user: me.data?.user ?? null, loading: me.isLoading, login, verifyMagic, logout }),
    [me.data, me.isLoading, login, verifyMagic, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
