"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { signIn, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const lessons = [
  {
    title: "Daily conversation",
    description: "Practice fluent answers for common work and travel situations.",
    meta: "18 min",
    tone: "bg-[#d8e4df] text-[#26362f] dark:bg-[#33483f] dark:text-[#dcebe4]",
  },
  {
    title: "Vocabulary builder",
    description: "Review 24 useful words with spaced repetition prompts.",
    meta: "24 words",
    tone: "bg-[#f0dccf] text-[#4b352c] dark:bg-[#4a3934] dark:text-[#f1d3c2]",
  },
  {
    title: "Grammar corrections",
    description: "Fix sentence structure and learn why each change works.",
    meta: "7 notes",
    tone: "bg-[#dedcf0] text-[#34324f] dark:bg-[#38364f] dark:text-[#e5e2ff]",
  },
];

const weeklyStats = [
  { label: "Practice streak", value: "12", detail: "days" },
  { label: "Words learned", value: "186", detail: "this month" },
  { label: "Corrections", value: "42", detail: "reviewed" },
];

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/dashboard");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <Sparkles className="size-4 text-primary" />
          Preparing LingoVe
        </div>
      </main>
    );
  }

  if (session?.user) {
    return null;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#E9E8EF] text-foreground">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <BrandMark />
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a className="transition-colors hover:text-foreground" href="#practice">
            Practice
          </a>
          <a className="transition-colors hover:text-foreground" href="#lessons">
            Lessons
          </a>
          <a className="transition-colors hover:text-foreground" href="#progress">
            Progress
          </a>
        </nav>
        <Button variant="outline" onClick={() => signIn.social({ provider: "google" })}>
          Sign in
        </Button>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-84px)] w-full max-w-7xl items-center gap-10 px-6 pb-12 pt-4 lg:grid-cols-[1fr_0.88fr] lg:px-8">
        <div className="max-w-3xl">
          <Badge variant="accent" className="mb-5">
            Guided English practice
          </Badge>
          <h1 className="font-heading text-5xl font-semibold leading-[1.03] tracking-normal text-[#252431] sm:text-6xl lg:text-7xl">
            LingoVe
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f5b6c]">
            Build confident English with daily speaking prompts, vocabulary
            practice, sentence corrections, and progress tracking in one calm
            workspace.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-11 px-5"
              onClick={() => signIn.social({ provider: "google" })}
            >
              <GoogleIcon />
              Continue with Google
            </Button>
            <Button variant="outline" size="lg" className="h-11 px-5">
              View practice plan
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {weeklyStats.map((item) => (
              <Card key={item.label} className="bg-[#f7f5f2]/80">
                <CardContent className="p-4">
                  <div className="text-2xl font-semibold">{item.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="relative min-h-130" aria-hidden="true">
          <div className="absolute inset-x-6 top-8 h-72 rounded-lg bg-[#d8e4df]" />
          <div className="absolute right-0 top-0 w-[88%] rounded-lg border border-border bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s focus</p>
                <h2 className="mt-1 text-xl font-semibold">Speak more naturally</h2>
              </div>
              <div className="rounded-lg bg-primary p-3 text-primary-foreground">
                <MessageCircle className="size-5" />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {lessons.map((lesson) => (
                <div
                  key={lesson.title}
                  className="flex gap-3 rounded-lg border border-border bg-background/70 p-3"
                >
                  <div className={cn("flex size-10 items-center justify-center rounded-lg", lesson.tone)}>
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {lesson.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-2 left-0 w-[72%] rounded-lg border border-border bg-[#f7f5f2] p-5 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-[#dedcf0] text-[#34324f]">
                <Brain className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Correction preview</p>
                <p className="text-sm text-muted-foreground">
                  I am agree {"->"} I agree
                </p>
              </div>
            </div>
            <div className="mt-5 h-2 rounded-full bg-muted">
              <div className="h-full w-3/4 rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
