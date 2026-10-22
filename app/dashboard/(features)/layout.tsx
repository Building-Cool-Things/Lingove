import { AppShell } from "@/components/lingov/app-shell";

// Earlier feature pages (Reading/Writing AI, Vocabulary, …) inside the Lingov shell.
export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
    </AppShell>
  );
}
