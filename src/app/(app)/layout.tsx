import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has an org (onboarding complete)
  const { data: orgUser } = await supabase
    .from("org_users")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  // Redirect to onboarding if no org exists (first-time user)
  const currentPath =
    typeof globalThis !== "undefined" ? "" : "";
  if (!orgUser) {
    // Allow onboarding page itself to render
    // This is handled by middleware or the page itself
  }

  // Fetch programs with their projects for sidebar
  let programs: { id: string; name: string; projects: { id: string; name: string; status: string }[] }[] = [];

  if (orgUser) {
    const { data: programsData } = await supabase
      .from("programs")
      .select("id, name")
      .eq("org_id", orgUser.org_id)
      .eq("archived", false)
      .order("name");

    if (programsData) {
      programs = await Promise.all(
        programsData.map(async (prog) => {
          const { data: projectsData } = await supabase
            .from("projects")
            .select("id, name, status")
            .eq("program_id", prog.id)
            .order("updated_at", { ascending: false })
            .limit(10);

          return {
            id: prog.id,
            name: prog.name,
            projects: (projectsData ?? []).map((p) => ({
              id: p.id,
              name: p.name,
              status: p.status ?? "in_progress",
            })),
          };
        })
      );
    }
  }

  return (
    <AppShell
      userEmail={user.email}
      programs={programs}
    >
      {children}
    </AppShell>
  );
}
