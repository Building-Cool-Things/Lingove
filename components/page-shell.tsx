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
        "mx-auto flex w-full max-w-[1120px] animate-lgup flex-col gap-5 px-5 py-3 lg:px-12 lg:pb-12 lg:pt-10",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold tracking-[-0.01em]">{title}</h1>
        {action}
      </div>
      {children}
    </section>
  );
}

export const sectionTitle = "text-base font-semibold tracking-[-0.015em]";

export const levelChip =
  "rounded-full bg-secondary px-2 py-0.5 text-[11.5px] font-semibold text-[#14653a] dark:text-[#7fe3a8]";
