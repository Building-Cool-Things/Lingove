import { LayoutDashboard } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <LayoutDashboard className="size-5" />
      </div>
      <div>
        <p className="text-base font-semibold leading-none">LingoVe</p>
        <p className="mt-1 text-xs text-muted-foreground">English practice</p>
      </div>
    </div>
  );
}
