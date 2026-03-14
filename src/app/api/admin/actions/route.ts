import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // Verify admin
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Service role client for admin operations
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case "change_plan": {
        const { org_id, plan_tier } = body;
        if (!org_id || !["starter", "growth", "pro"].includes(plan_tier)) {
          return NextResponse.json(
            { error: "Invalid org_id or plan_tier" },
            { status: 400 }
          );
        }
        const { error } = await adminClient
          .from("orgs")
          .update({ plan_tier })
          .eq("id", org_id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "disable_user": {
        const { user_id } = body;
        if (!user_id) {
          return NextResponse.json(
            { error: "Missing user_id" },
            { status: 400 }
          );
        }
        const { error } = await adminClient
          .from("org_users")
          .update({ disabled: true })
          .eq("user_id", user_id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "enable_user": {
        const { user_id } = body;
        if (!user_id) {
          return NextResponse.json(
            { error: "Missing user_id" },
            { status: 400 }
          );
        }
        const { error } = await adminClient
          .from("org_users")
          .update({ disabled: false })
          .eq("user_id", user_id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "password_reset": {
        const { email } = body;
        if (!email) {
          return NextResponse.json(
            { error: "Missing email" },
            { status: 400 }
          );
        }
        const { error } = await adminClient.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "invite_user": {
        const { org_id, email } = body;
        if (!org_id || !email) {
          return NextResponse.json(
            { error: "Missing org_id or email" },
            { status: 400 }
          );
        }
        const { error } = await adminClient.auth.admin.inviteUserByEmail(
          email,
          { data: { org_id } }
        );
        if (error) throw error;

        // Also record in team_invites
        await adminClient.from("team_invites").insert({
          org_id,
          email,
          role: "member",
          invited_by: user.id,
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error(`Admin action "${action}" failed:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
