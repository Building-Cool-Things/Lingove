"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  BriefcaseBusiness,
  ClipboardCheck,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  MessageCircle,
  Moon,
  PenLine,
  Sparkles,
  Sun,
  Target,
  Volume2,
} from "lucide-react";

import {
  completeOnboarding,
  getOnboardingState,
} from "@/app/actions/onboarding";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const sidebarItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Reading", href: "/dashboard/reading", icon: BookOpen },
  { label: "Writing", href: "/dashboard/writing", icon: PenLine },
  { label: "Speaking", href: "/dashboard/speaking", icon: MessageCircle },
  { label: "Listening", href: "/dashboard/listening", icon: Volume2 },
  { label: "Vocabulary", href: "/dashboard/vocabulary", icon: LibraryBig },
  { label: "Corrections", href: "/dashboard/corrections", icon: ClipboardCheck },
  { label: "Progress", href: "/dashboard/progress", icon: Target },
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
  const [darkMode, setDarkMode] = useState(false);

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
    <div className={cn("h-screen overflow-hidden bg-background text-foreground", darkMode && "dark")}>
      <div className="flex h-full flex-col overflow-hidden lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 px-5 py-5">
            <BrandMark />
            <Button
              variant="ghost"
              size="icon"
              aria-label={darkMode ? "Use light dashboard" : "Use dark dashboard"}
              onClick={() => setDarkMode((current) => !current)}
            >
              {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>

          <nav className="grid gap-1 px-3 pb-4">
            {sidebarItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Button
                  key={item.label}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "h-10 justify-start px-3 text-sidebar-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                  asChild
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3 text-sidebar-accent-foreground">
              <div className="flex size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="mt-3 w-full justify-start text-sidebar-foreground"
              onClick={() => signOut()}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
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

function OnboardingModal() {
  const [open, setOpen] = useState(false);
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

    return () => {
      isActive = false;
    };
  }, []);

  function toggleInterest(item: string) {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!occupation) {
      setError("Please select what you do.");
      return;
    }

    if (interests.size === 0) {
      setError("Please pick at least one interest.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await completeOnboarding({
          occupation,
          interests: [...interests],
        });

        if (result.ok) {
          setOpen(false);
        } else {
          setError(result.message);
        }
      } catch {
        setError("Could not save. Please try again.");
      }
    });
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/45 px-4 py-6 backdrop-blur-sm">
      <div
        aria-modal="true"
        role="dialog"
        className="flex w-full max-w-2xl flex-col rounded-xl border border-border bg-card text-card-foreground shadow-2xl max-h-[90vh]"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border p-5 sm:p-6">
            <Badge variant="accent">First setup</Badge>
            <h2 className="mt-4 text-2xl font-semibold tracking-normal">
              Shape your English practice
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Help us personalize your lessons, prompts, and vocabulary.
            </p>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
            <div className="space-y-2">
              <Label className="gap-1.5 text-sm font-medium">
                <BriefcaseBusiness className="size-4 text-primary" />
                What do you do?
              </Label>
              <Select value={occupation} onValueChange={(val) => setOccupation(val ?? "")}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select your occupation..." />
                </SelectTrigger>
                <SelectContent>
                  {OCCUPATIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">What topics interest you?</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Pick as many as you like — we&apos;ll use these to find relevant practice content.
                </p>
              </div>

              {INTEREST_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {group.items.map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <Checkbox
                          id={`interest-${item}`}
                          checked={interests.has(item)}
                          onCheckedChange={() => toggleInterest(item)}
                        />
                        <Label
                          htmlFor={`interest-${item}`}
                          className="cursor-pointer font-normal"
                        >
                          {item}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 space-y-3 border-t border-border p-5 sm:p-6">
            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button disabled={isPending} type="submit" className="h-10 px-4">
                <Sparkles className="size-4" />
                {isPending ? "Saving..." : "Save and start"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
