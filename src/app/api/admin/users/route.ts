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
