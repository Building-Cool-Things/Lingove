"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  MessageCircle,
  PenLine,
  Sparkles,
  Target,
  Volume2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const weeklyStats = [
  { label: "Practice streak", value: "12", detail: "days" },
  { label: "Words learned", value: "186", detail: "this month" },
  { label: "Corrections", value: "42", detail: "reviewed" },
];

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

const practiceSkills = [
  {
    title: "Reading",
    description: "Short passages with meaning checks.",
    icon: BookOpen,
    detail: "2 texts",
    href: "/dashboard/reading",
    tone: "bg-[#d8e4df] text-[#26362f] dark:bg-[#33483f] dark:text-[#dcebe4]",
  },
  {
    title: "Writing",
    description: "Sentence practice with corrections.",
    icon: PenLine,
    detail: "3 prompts",
    href: "/dashboard/writing",
    tone: "bg-[#f0dccf] text-[#4b352c] dark:bg-[#4a3934] dark:text-[#f1d3c2]",
  },
  {
    title: "Listening",
    description: "Audio drills for natural rhythm.",
    icon: Volume2,
    detail: "8 clips",
    href: "/dashboard/listening",
    tone: "bg-[#dedcf0] text-[#34324f] dark:bg-[#38364f] dark:text-[#e5e2ff]",
  },
  {
    title: "Speaking",
    description: "Record answers and improve fluency.",
    icon: MessageCircle,
    detail: "5 min",
    href: "/dashboard/speaking",
    tone: "bg-[#e6d994] text-[#443b1d] dark:bg-[#4d4528] dark:text-[#f1e8b1]",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const displayName = session?.user?.name ?? "LingoVe learner";

  return (
    <section className="px-5 py-6 sm:px-8 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="secondary">Today&apos;s learning desk</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
            Keep your English moving, {displayName.split(" ")[0]}.
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Continue your lesson, review new words, and check corrections from recent practice.
          </p>
        </div>
        <Button>
          <Sparkles className="size-4" />
          Start practice
        </Button>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {weeklyStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-semibold">{stat.value}</span>
                <span className="pb-1 text-sm text-muted-foreground">{stat.detail}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Learning path</CardTitle>
            <CardDescription>
              Your next exercises are ordered by impact and review timing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lessons.map((lesson) => (
              <div
                key={lesson.title}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background/55 p-4 sm:flex-row sm:items-center"
              >
                <div className={cn("flex size-11 items-center justify-center rounded-lg", lesson.tone)}>
                  <GraduationCap className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{lesson.title}</p>
                    <Badge variant="outline">{lesson.meta}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{lesson.description}</p>
                </div>
                <Button variant="outline" size="sm">
                  Open
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Practice skills</CardTitle>
              <CardDescription>Choose one area to focus on.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {practiceSkills.map((skill) => (
                  <Link
                    key={skill.title}
                    href={skill.href}
                    className="group rounded-lg border border-border bg-background/55 p-4 transition-all hover:border-primary/40 hover:bg-background"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={cn("flex size-10 items-center justify-center rounded-lg", skill.tone)}>
                        <skill.icon className="size-5" />
                      </div>
                      <Badge variant="outline">{skill.detail}</Badge>
                    </div>
                    <h3 className="mt-4 font-semibold">{skill.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {skill.description}
                    </p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                      Open
                      <ChevronRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
