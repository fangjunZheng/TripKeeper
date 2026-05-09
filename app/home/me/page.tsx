"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/context/user-context";

export default function MePage() {
  const { user, loading, error } = useUser();

  const isUnauthorized =
    !loading &&
    !user &&
    (error === "Unauthorized" || error === "未登录");

  return (
    <div className="space-y-4 pb-2">
      <div className="w-full rounded-3xl bg-white px-6 py-8 shadow-sm ring-1 ring-slate-100">
        <div className="mb-4">
          <h1 className="text-base font-semibold tracking-tight text-slate-900">我的</h1>
        </div>

        {loading && (
          <p className="text-sm text-slate-500">加载中...</p>
        )}

        {!loading && isUnauthorized && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              当前未登录，请先通过手机号 + 验证码登录。
            </p>
            <Button
              className="w-full"
              onClick={() => { window.location.href = "/login"; }}
            >
              去登录
            </Button>
          </div>
        )}

        {!loading && user && (
          <div className="space-y-4">
            <div className="space-y-1 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">姓名</p>
              <p className="text-sm text-slate-900">{user.name || "未填写"}</p>
            </div>

            <div className="space-y-1 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">手机号</p>
              <p className="text-sm text-slate-900">{user.phone}</p>
            </div>

            <div className="space-y-1 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">角色</p>
              <p className="text-sm text-slate-900">
                {user.role === "ADMIN" ? "管理员" : "司机"}
              </p>
            </div>

            <div className="pt-2">
              <Button
                className="h-9 w-full rounded-full text-xs font-medium"
                variant="outline"
                type="button"
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", { method: "POST" });
                  } finally {
                    window.location.href = "/login";
                  }
                }}
              >
                退出登录
              </Button>
            </div>
          </div>
        )}

        {!loading && !user && !isUnauthorized && error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}
