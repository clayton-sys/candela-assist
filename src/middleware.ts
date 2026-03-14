import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that bypass middleware entirely
const PUBLIC_PATHS = ["/", "/login", "/about", "/pricing", "/license-expired"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/lm/")) return true;
  if (pathname.startsWith("/embed/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  // Static files
  if (pathname.includes(".")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /app/* and /admin/* routes
  if (!pathname.startsWith("/app/") && !pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // If Supabase is not configured yet, redirect to login (setup required)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Never run code between createServerClient and auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated → redirect to login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes: only check auth (layout handles ADMIN_USER_ID)
  if (pathname.startsWith("/admin")) {
    return supabaseResponse;
  }

  // Check org membership, disabled status, and license
  const { data: orgUser } = await supabase
    .from("org_users")
    .select("org_id, disabled")
    .eq("user_id", user.id)
    .single();

  // Block disabled users
  if (orgUser?.disabled) {
    return NextResponse.redirect(new URL("/login?error=disabled", request.url));
  }

  if (orgUser?.org_id) {
    const { data: org } = await supabase
      .from("orgs")
      .select("license_status")
      .eq("id", orgUser.org_id)
      .single();

    if (
      org?.license_status === "expired" ||
      org?.license_status === "suspended"
    ) {
      return NextResponse.redirect(new URL("/license-expired", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
