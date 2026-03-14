import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  if (request.headers.get("x-admin-key") !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: orgs, error } = await adminClient
    .from("orgs")
    .select("id, name, legal_name, plan, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch user and project counts per org
  const rows = await Promise.all(
    (orgs ?? []).map(async (org) => {
      const [{ count: userCount }, { count: projectCount }] =
        await Promise.all([
          adminClient
            .from("org_users")
            .select("*", { count: "exact", head: true })
            .eq("org_id", org.id),
          adminClient
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("org_id", org.id),
        ]);
      return {
        ...org,
        userCount: userCount ?? 0,
        projectCount: projectCount ?? 0,
      };
    })
  );

  return NextResponse.json({ orgs: rows });
}
