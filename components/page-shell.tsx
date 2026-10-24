import { cn } from "@/lib/utils";

// Page frame from the Lingov design (Explore / Practice screens).
export function PageShell({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-[1120px] animate-lgup flex-col gap-5 px-5 py-3 lg:px-8 lg:pb-12 lg:pt-8",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-bold tracking-[-.01em]">{title}</h1>
        {action}
      </div>
      {children}
    </section>
  );
}

export const sectionTitle = "text-base font-bold tracking-[-.01em]";

export const levelChip =
  "rounded-full bg-secondary px-2 py-0.5 text-[11.5px] font-bold text-[#52C79A] dark:text-[#52C79A]";
