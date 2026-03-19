export default function ImpactStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col h-full flex-1 overflow-auto">{children}</div>;
}
