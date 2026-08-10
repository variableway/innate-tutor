import type { CatalogCourse } from "@innate/contracts";
import { CatalogHome } from "@/components/catalog-home";
import { listCourses } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let courses: CatalogCourse[] = [];
  try {
    courses = await listCourses();
  } catch {
    courses = [];
  }
  return <CatalogHome initialCourses={courses} />;
}
