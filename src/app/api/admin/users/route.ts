import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (request.headers.get("x-admin-key") !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch org_users with org data
  const { data: orgUsers, error } = await adminClient
    .from("org_users")
    .select(
      "user_id, disabled, created_at, orgs(id, name, plan)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build user rows with last_active and auth info
  const users = await Promise.all(
    (orgUsers ?? []).map(async (ou) => {
      const org = ou.orgs as unknown as {
        id: string;
        name: string;
        plan: string;
      } | null;

      // Get last active project
      let lastActive: string | null = null;
      if (org) {
        const { data: proj } = await adminClient
          .from("projects")
          .select("updated_at")
          .eq("org_id", org.id)
          .eq("created_by", ou.user_id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        lastActive = proj?.updated_at ?? null;
      }

      // Get auth user info
      let email = "";
      let name: string | null = null;
      try {
        const {
          data: { user: authUser },
        } = await adminClient.auth.admin.getUserById(ou.user_id);
        if (authUser) {
          email = authUser.email ?? "";
          name =
            (authUser.user_metadata?.full_name as string) ??
            (authUser.user_metadata?.name as string) ??
            null;
        }
      } catch {
        // Skip
      }

      return {
        user_id: ou.user_id,
        email,
        name,
        org_name: org?.name ?? "—",
        org_id: org?.id ?? "",
        plan: org?.plan ?? "starter",
        created_at: ou.created_at,
        last_active: lastActive,
        disabled: ou.disabled,
      };
    })
  );

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  // Verify admin
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userIds } = await request.json();
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ emails: {} });
  }

  // Use service role to look up auth users
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const emails: Record<string, { email: string; name: string | null }> = {};
  for (const uid of userIds) {
    try {
      const {
        data: { user: authUser },
      } = await adminClient.auth.admin.getUserById(uid);
      if (authUser) {
        emails[uid] = {
          email: authUser.email ?? "",
          name:
            (authUser.user_metadata?.full_name as string) ??
            (authUser.user_metadata?.name as string) ??
            null,
        };
      }
    } catch {
      // Skip users we can't find
    }
  }

  return NextResponse.json({ emails });
}
