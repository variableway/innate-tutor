import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { getPrincipalFromCookies } from "@/lib/identity";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const principal = await getPrincipalFromCookies();
  if (principal) redirect("/");

  return (
    <div className="shell auth-shell">
      <header className="hero">
        <Link href="/" className="brand">
          InnateTutor
        </Link>
        <p className="lede">注册本地账号。每个账号会得到独立的个人 tenant（owner）。</p>
      </header>
      <AuthForm mode="register" />
    </div>
  );
}
