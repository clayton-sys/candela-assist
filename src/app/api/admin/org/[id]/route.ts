import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Verify admin
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const orgId = params.id;

  // Service role client bypasses RLS
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Fetch org
    const { data: org, error: orgError } = await adminClient
      .from("orgs")
      .select(
        "id, name, org_display_name, legal_name, website, org_type, mission_statement, plan_tier, brand_primary, brand_logo_url"
      )
      .eq("id", orgId)
      .single();

    if (orgError) throw orgError;
    if (!org) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    // Fetch org users
    const { data: orgUsers, error: usersError } = await adminClient
      .from("org_users")
      .select("user_id, role")
      .eq("org_id", orgId);

    if (usersError) throw usersError;

    // Fetch user emails from auth
    const users = await Promise.all(
      (orgUsers ?? []).map(async (u) => {
        try {
          const {
            data: { user: authUser },
          } = await adminClient.auth.admin.getUserById(u.user_id);
          return {
            user_id: u.user_id,
            email: authUser?.email ?? "",
            name:
              (authUser?.user_metadata?.full_name as string) ??
              (authUser?.user_metadata?.name as string) ??
              null,
            role: u.role,
            last_active: null,
          };
        } catch {
          return {
            user_id: u.user_id,
            email: "",
            name: null,
            role: u.role,
            last_active: null,
          };
        }
      })
    );

    // Fetch projects
    const { data: projects, error: projError } = await adminClient
      .from("projects")
      .select("id, name, status, project_type, updated_at")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false });

    if (projError) throw projError;

    return NextResponse.json({ org, users, projects: projects ?? [] });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error(`Admin org detail fetch failed:`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
