import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 font-jost text-[11px] print-hidden">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-stone/30">/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="text-stone/50 hover:text-stone transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-stone/70">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
