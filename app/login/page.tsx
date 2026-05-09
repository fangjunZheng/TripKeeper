"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Truck, Phone, KeyRound, User, CheckCircle2, ArrowLeft } from "lucide-react";

type Step = "phone" | "otp" | "done";

const IS_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";
const DEV_CODE = "123456";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  function startCountdown() {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "发送验证码失败");
      startCountdown();
      if (IS_MOCK_AUTH) setCode(DEV_CODE);
      setStep("otp");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "发送验证码失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!code || code.length < 4) {
      setMessage("请输入验证码");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "登录失败");
      setStep("done");
      window.location.href = "/home/today";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
      {/* 品牌 Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-md">
          <Truck className="h-8 w-8 text-white" strokeWidth={1.8} />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold tracking-tight text-slate-900">运程管家</p>
          <p className="text-xs text-slate-500">司机出车记录系统</p>
        </div>
      </div>

      {/* 卡片 */}
      <div className="w-full max-w-sm rounded-3xl bg-white px-6 py-8 shadow-sm ring-1 ring-slate-100">

        {/* 开发环境提示条 */}
        {IS_MOCK_AUTH && step !== "done" && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
            <span className="mt-0.5 shrink-0 text-base leading-none">🛠</span>
            <div>
              <p className="font-medium">开发模式</p>
              <p className="mt-0.5 text-amber-600">
                验证码已自动填入 <span className="font-mono font-semibold">{DEV_CODE}</span>，无需接收短信，直接点击登录即可。
              </p>
            </div>
          </div>
        )}

        {/* 步骤指示器 */}
        {step !== "done" && (
          <div className="mb-6 flex items-center gap-2">
            <StepDot active={true} done={step === "otp"} label="输入手机号" />
            <div className={`h-px flex-1 transition-colors ${step === "otp" ? "bg-primary" : "bg-slate-200"}`} />
            <StepDot active={step === "otp"} done={false} label="验证码登录" />
          </div>
        )}

        {/* ── 第一步：输入手机号 ── */}
        {step === "phone" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                  placeholder="请输入 11 位手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                />
              </div>
            </div>

            <div className="pt-1">
              <Button
                type="button"
                className="h-10 w-full rounded-full text-sm font-medium"
                onClick={handleSendCode}
                disabled={loading || countdown > 0}
              >
                {loading ? "发送中..." : countdown > 0 ? `${countdown}s 后重新发送` : "发送验证码"}
              </Button>
            </div>

            {message && <p className="text-xs text-red-500">{message}</p>}
          </div>
        )}

        {/* ── 第二步：输入验证码 ── */}
        {step === "otp" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-500">验证码已发送至</p>
              <p className="text-sm font-medium text-slate-900">{phone}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">验证码</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm tracking-widest outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                  placeholder="请输入验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                姓名 <span className="text-slate-400">（可选，首次登录填写）</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                  placeholder="您的姓名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
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

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-700"
                  onClick={() => { setStep("phone"); setCode(""); setMessage(null); }}
                >
                  <ArrowLeft className="h-3 w-3" />
                  更换手机号
                </button>
                <button
                  type="button"
                  disabled={countdown > 0 || loading}
                  className="text-xs text-primary transition disabled:text-slate-400"
                  onClick={handleSendCode}
                >
                  {countdown > 0 ? `${countdown}s 后重发` : "重新发送"}
                </button>
              </div>
            </div>

            {message && <p className="text-xs text-red-500">{message}</p>}
          </div>
        )}

        {/* ── 完成 ── */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="text-sm font-medium text-slate-900">登录成功，跳转中…</p>
          </div>
        )}
      </div>

      <p className="mt-6 text-[11px] text-slate-400">
        登录即表示您同意相关服务条款
      </p>
    </main>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={[
          "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
          done ? "bg-emerald-500 text-white" : active ? "bg-primary text-white" : "bg-slate-200 text-slate-400",
        ].join(" ")}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : active ? "●" : "○"}
      </div>
      <p className={`text-[9px] ${active || done ? "text-slate-700" : "text-slate-400"}`}>{label}</p>
    </div>
  );
}
