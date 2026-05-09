"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { UserInfo, MeResponse } from "@/types/api";

type UserState = {
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
  /** 手动触发重新获取当前用户（如 session 可能已过期时使用） */
  refresh: () => Promise<void>;
};

const UserContext = createContext<UserState>({
  user: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const json = (await res.json()) as MeResponse;
      if (json.ok) {
        setUser(json.user);
        setError(null);
      } else {
        setUser(null);
        setError(json.error);
      }
    } catch {
      setUser(null);
      setError("请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <UserContext.Provider value={{ user, loading, error, refresh: fetchMe }}>
      {children}
    </UserContext.Provider>
  );
}

/** 在 /home/* 下的任意客户端组件中获取当前用户信息（只请求一次 API）。 */
export function useUser(): UserState {
  return useContext(UserContext);
}
