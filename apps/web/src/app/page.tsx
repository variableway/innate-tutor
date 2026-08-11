import type { CatalogCourse } from "@innate/contracts";
import { AuthBar } from "@/components/auth-bar";
import { CatalogHome } from "@/components/catalog-home";
import { listCourses } from "@/lib/db";
import { getPrincipalFromCookies } from "@/lib/identity";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let courses: CatalogCourse[] = [];
  try {
    courses = await listCourses();
  } catch {
    courses = [];
  }
  const principal = await getPrincipalFromCookies();
  const user = principal
    ? {
        id: principal.userId,
        email: principal.email,
        displayName: principal.displayName,
        tenantId: principal.tenantId,
        role: principal.role,
        provider: principal.provider,
      }
    : null;

  return (
    <>
      <div className="shell" style={{ paddingBottom: 0 }}>
        <AuthBar user={user} />
      </div>
      <CatalogHome initialCourses={courses} />
    </>
  );
}
