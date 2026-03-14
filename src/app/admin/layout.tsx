import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    redirect("/");
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#1B2B3A",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Admin top bar */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-[#3A6B8A]/30">
        <div className="flex items-center gap-4">
          <span
            className="text-[#EDE8DE] text-lg"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 600,
            }}
          >
            Candela Assist
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-bold tracking-wider bg-[#E9C03A] text-[#1B2B3A]">
            ADMIN
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/admin"
            className="text-[#EDE8DE]/70 hover:text-[#E9C03A] transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="text-[#EDE8DE]/70 hover:text-[#E9C03A] transition-colors"
          >
            Users
          </Link>
          <Link
            href="/admin/orgs"
            className="text-[#EDE8DE]/70 hover:text-[#E9C03A] transition-colors"
          >
            Orgs
          </Link>
          <Link
            href="/app"
            className="text-[#3A6B8A] hover:text-[#5a8fad] transition-colors"
          >
            Exit Admin
          </Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
