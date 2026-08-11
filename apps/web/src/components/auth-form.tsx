"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(mode === "register" ? { displayName: displayName || undefined } : {}),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "请求失败");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form className="panel stack auth-form" onSubmit={submit}>
      <h2>{mode === "login" ? "登录" : "注册"}</h2>
      <p className="lede" style={{ margin: 0, fontSize: "0.95rem" }}>
        当前为本地账号（IDENTITY_PROVIDER=local）。日后可切换 OIDC，会话与 Principal
        模型保持不变。
      </p>
      {mode === "register" ? (
        <label>
          显示名（可选）
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="nickname"
          />
        </label>
      ) : null}
      <label>
        邮箱
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>
      <label>
        密码{mode === "register" ? "（至少 8 位）" : ""}
        <input
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>
      <div className="actions">
        <button type="submit" className="button" disabled={pending}>
          {pending ? "提交中…" : mode === "login" ? "登录" : "创建账号"}
        </button>
        <Link className="button secondary" href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? "去注册" : "去登录"}
        </Link>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
    </form>
  );
}
