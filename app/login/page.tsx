"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Step = "phone" | "otp" | "done";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  async function handleSendCode() {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setMessage("请输入正确的手机号");
      return;
    }

    if (countdown > 0) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (res.ok) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "发送验证码失败");
      }

      setDevCode(data.devCode ?? null);
      setStep("otp");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "发送验证码失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    // if (!code || !/^d{6}$/.test(code)) {
    //   setMessage("请输入正确的验证码");
    //   return;
    // }
    setMessage(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, code, name: name.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "登录失败");
      }

      setStep("done");
      // 会话已在服务端写入 cookie（本地存储），登录成功后直接进入司机首页
      window.location.href = "/home/today";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white px-6 py-8 shadow-sm ring-1 ring-slate-100">
        <div className="mb-6">
          <p className="text-xs font-medium tracking-wide text-primary">
            运程管家
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            手机号登录
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            使用手机号接收一次性验证码登录，无需记密码。
          </p>
        </div>

        {step === "phone" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                手机号
              </label>
              <input
                type="tel"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="pt-1">
              <Button
                type="button"
                className="h-10 w-full rounded-full text-sm font-medium"
                onClick={handleSendCode}
                disabled={loading}
              >
                {loading ? "发送中..." : "发送验证码"}
              </Button>
            </div>

            {message && (
              <p className="text-xs text-red-500">
                {message}
              </p>
            )}

            {devCode && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                开发环境固定验证码：<span className="font-mono">{devCode}</span>
              </p>
            )}
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                手机号
              </label>
              <input
                type="tel"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-200"
                value={phone}
                disabled
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                验证码
              </label>
              <input
                type="text"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                placeholder="请输入验证码（当前为固定 123456）"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                姓名（可选）
              </label>
              <input
                type="text"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                placeholder="第一次登录可填写姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-1">
              <Button
                type="button"
                className="h-10 w-full rounded-full text-sm font-medium"
                onClick={handleVerify}
                disabled={loading}
              >
                {loading ? "验证中..." : "登录"}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-xs text-slate-500"
                type="button"
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setMessage(null);
                }}
              >
                返回重新输入手机号
              </Button>
            </div>

            {message && (
              <p className="text-xs text-red-500">
                {message}
              </p>
            )}

            {devCode && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                当前开发固定验证码：<span className="font-mono">{devCode}</span>
              </p>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-emerald-600">
              登录成功！
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

