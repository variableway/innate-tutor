"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  tenantId: string;
  role: string;
  provider: string;
};

export function AuthBar({ user }: { user: AuthUser | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
    });
  }

  return (
    <div className="auth-bar">
      {user ? (
        <>
          <span className="auth-bar-user">
            {user.displayName}
            <span className="auth-bar-meta"> · {user.provider}</span>
          </span>
          <button type="button" className="button secondary" disabled={pending} onClick={logout}>
            {pending ? "退出中…" : "退出"}
          </button>
        </>
      ) : (
        <>
          <Link className="button secondary" href="/login">
            登录
          </Link>
          <Link className="button" href="/register">
            注册
          </Link>
        </>
      )}
    </div>
  );
}
