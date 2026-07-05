"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Check,
  ClipboardCheck,
  Code2,
  FileCheck,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  MessageCircle,
  Monitor,
  Moon,
  MoreVertical,
  PenLine,
  Search,
  Sparkles,
  Sun,
  Target,
  User,
  Volume2,
  Wrench,
} from "lucide-react";

import {
  completeOnboarding,
  getOnboardingState,
} from "@/app/actions/onboarding";
import { BrandMark } from "@/components/brand-mark";
import { type Theme, useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const OCCUPATIONS = [
  "School Student",
  "College Student",
  "Working Professional",
  "Software Developer",
  "Business Owner",
  "Freelancer",
  "Teacher",
  "Doctor",
  "Engineer",
  "Preparing for Government Exams",
  "Looking for a Job",
  "Homemaker",
  "Other",
];

const INTEREST_GROUPS = [
  {
    label: "Technology",
    items: ["Technology", "Programming", "AI", "Web Development", "Cybersecurity", "Data Science"],
  },
  {
    label: "Entertainment",
    items: ["Entertainment", "Anime", "Movies", "Netflix", "Marvel", "K-Drama"],
  },
  {
    label: "Lifestyle",
    items: ["Lifestyle", "Fitness", "Fashion", "Cooking", "Travel", "Photography"],
  },
  {
    label: "Learning",
    items: ["Learning", "Books", "Productivity", "Psychology", "Philosophy", "History"],
  },
  {
    label: "Business",
    items: ["Business", "Entrepreneurship", "Finance", "Investing", "Marketing", "Sales"],
  },
];

const OCCUPATION_ICONS: Record<string, React.ElementType> = {
  "School Student": GraduationCap,
  "College Student": GraduationCap,
  "Working Professional": BriefcaseBusiness,
  "Software Developer": Code2,
  "Business Owner": Building2,
  "Freelancer": Laptop,
  "Teacher": BookOpen,
  "Doctor": Heart,
  "Engineer": Wrench,
  "Preparing for Government Exams": FileCheck,
  "Looking for a Job": Search,
  "Homemaker": Home,
  "Other": User,
};

const sidebarItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Reading", href: "/dashboard/reading", icon: BookOpen },
  { label: "Writing", href: "/dashboard/writing", icon: PenLine },
  // { label: "Speaking", href: "/dashboard/speaking", icon: MessageCircle },
  // { label: "Listening", href: "/dashboard/listening", icon: Volume2 },
  { label: "Vocabulary", href: "/dashboard/vocabulary", icon: LibraryBig },
  // { label: "Corrections", href: "/dashboard/corrections", icon: ClipboardCheck },
  // { label: "Progress", href: "/dashboard/progress", icon: Target },
];

function getInitials(value?: string | null) {
  if (!value) return "LV";
  const parts = value
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <Sparkles className="size-4 text-primary" />
          Preparing LingoVe
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials = getInitials(user.name ?? user.email);
  const displayName = user.name ?? "LingoVe learner";

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full flex-col overflow-hidden lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 px-5 py-5">
            <BrandMark />
            <ThemeSwitcher current={theme} onChange={setTheme} />
          </div>

          <nav className="grid gap-1 px-3 pb-4">
            {sidebarItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link href={item.href} key={item.label} className={cn(
                  "h-10 justify-start px-3 text-sidebar-foreground hover:bg-white/10 rounded-lg",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground flex "
                )}>
                  <div
                    className="flex items-center gap-3 h-10"
                  >

                    <item.icon className="size-4" />
                    {item.label}

                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-sidebar-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg bg-sidebar-accent p-3 text-left text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent/80 focus-visible:outline-none">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <MoreVertical className="size-4 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-64">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      <OnboardingModal />
    </div>
  );
}

// ── ThemeSwitcher ─────────────────────────────────────────────────────────────

const THEME_OPTIONS: { value: Theme; icon: React.ElementType; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "system", icon: Monitor, label: "System" },
  { value: "dark", icon: Moon, label: "Dark" },
];

function ThemeSwitcher({
  current,
  onChange,
}: {
  current: Theme;
  onChange: (t: Theme) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
      {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          title={label}
          onClick={() => onChange(value)}
          className={cn(
            current === value
              ? "bg-background text-foreground shadow-sm hover:bg-background"
              : "text-muted-foreground"
          )}
        >
          <Icon className="size-3.5" />
        </Button>
      ))}
    </div>
  );
}

function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [occupation, setOccupation] = useState("");
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isActive = true;
    getOnboardingState()
      .then((profile) => {
        if (!isActive) return;
        if (profile && !profile.hasOnboarded) setOpen(true);
      })
      .catch(() => {
        if (!isActive) return;
        setError("Could not load your profile. Please refresh and try again.");
        setOpen(true);
      });
    return () => { isActive = false; };
  }, []);

  function toggleInterest(item: string) {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item); else next.add(item);
      return next;
    });
  }

  function handleContinue() {
    if (!occupation) { setError("Please select what you do."); return; }
    setError("");
    setStep(2);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (interests.size === 0) { setError("Please pick at least one interest."); return; }
    startTransition(async () => {
      try {
        const result = await completeOnboarding({ occupation, interests: [...interests] });
        if (result.ok) setOpen(false);
        else setError(result.message);
      } catch {
        setError("Could not save. Please try again.");
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md">
      <div
        aria-modal="true"
        role="dialog"
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        style={{ maxHeight: "90vh" }}
      >
        {/* ── Top bar: step pills + label ── */}
        <div className="flex shrink-0 items-center justify-between px-6 pt-5">
          <div className="flex items-center gap-1.5">
            {([1, 2] as const).map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  s === step ? "w-8 bg-primary"
                    : s < step ? "w-4 bg-primary/50"
                      : "w-4 bg-muted",
                )}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
          </span>
        </div>

        {/* ══ STEP 1 — occupation ══════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            <div className="shrink-0 px-6 pb-4 pt-4">
              <h2 className="text-2xl font-bold tracking-tight">Who are you?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;ll tailor your practice to match your background.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
              <div className="grid grid-cols-3 gap-2">
                {OCCUPATIONS.map((occ) => {
                  const Icon = OCCUPATION_ICONS[occ] ?? User;
                  const active = occupation === occ;
                  return (
                    <Button
                      key={occ}
                      variant="ghost"
                      onClick={() => { setOccupation(occ); setError(""); }}
                      className={cn(
                        "group h-auto w-full flex-col gap-2.5 rounded-xl border-2 px-2 py-4",
                        active
                          ? "border-primary bg-primary/5 text-primary hover:bg-primary/5"
                          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      <div className={cn(
                        "flex size-9 items-center justify-center rounded-full transition-colors",
                        active ? "bg-primary/10" : "bg-muted group-hover/button:bg-primary/5",
                      )}>
                        <Icon className="size-4" />
                      </div>
                      <span className="text-[11px] font-semibold leading-4">{occ}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 px-6 pb-5 pt-4">
              {error && (
                <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}
              <Button onClick={handleContinue} className="h-11 w-full text-sm font-semibold">
                Continue
              </Button>
            </div>
          </>
        )}

        {/* ══ STEP 2 — interests ═══════════════════════════════════════════════ */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-6 pb-4 pt-4">
              <h2 className="text-2xl font-bold tracking-tight">What excites you?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick topics you love — we&apos;ll build your practice around them.
                {interests.size > 0 && (
                  <span className="ml-1.5 font-bold text-primary">{interests.size} selected</span>
                )}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 space-y-5">
              {INTEREST_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => {
                      const active = interests.has(item);
                      return (
                        <Button
                          key={item}
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleInterest(item)}
                          className={cn(
                            "h-auto rounded-full border px-3.5 py-1.5 font-medium",
                            active
                              ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm"
                              : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/50",
                          )}
                        >
                          {active && <Check className="size-3" />}
                          {item}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 px-6 pb-5 pt-4 space-y-3">
              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-5"
                  onClick={() => { setStep(1); setError(""); }}
                >
                  Back
                </Button>
                <Button type="submit" disabled={isPending} className="h-11 flex-1 font-semibold">
                  <Sparkles className="size-4" />
                  {isPending ? "Setting up…" : "Start learning"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
