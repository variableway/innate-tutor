import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { getPrincipalFromCookies } from "@/lib/identity";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const principal = await getPrincipalFromCookies();
  if (principal) redirect("/");

  return (
    <div className="shell auth-shell">
      <header className="hero">
        <Link href="/" className="brand">
          InnateTutor
        </Link>
        <p className="lede">使用本地账号登录 Catalog。</p>
      </header>
      <AuthForm mode="login" />
    </div>
  );
}
