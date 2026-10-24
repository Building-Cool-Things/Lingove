"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BookA, Feather, User, Glasses, LayoutDashboard, MessageCircle, LogOut, Puzzle, Rocket, Telescope, type LucideIcon } from "lucide-react";

import { signOut } from "@/lib/auth-client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, useSidebar,
} from "@/components/ui/sidebar";
import { TABS } from "@/lib/lingov/data";
import { cn } from "@/lib/utils";

import { useLingov } from "./store";
import { BrandMark, Pic } from "./ui";

// Emerald: flat surfaces, muted icons, the open page gets the raised surface and the primary colour.
const row = "h-11 gap-3 rounded-2xl px-3 text-[14.5px] font-medium text-[#A3ABA7] transition-colors hover:bg-[#212524] hover:text-[#F3F6F4] data-active:bg-[#212524] data-active:font-bold data-active:text-[#52C79A] [&_svg]:size-[18px] group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:[&>span]:hidden";
const subRow = "h-9 w-full cursor-pointer gap-2.5 rounded-xl px-2.5 text-[13.5px] font-medium text-[#A3ABA7] hover:bg-[#212524] hover:text-[#F3F6F4] data-active:bg-[#212524] data-active:font-bold data-active:text-[#52C79A] [&>svg]:size-4";

const MAIN: [LucideIcon, string, string][] = [
  [LayoutDashboard, "Home", "/dashboard"],
  [MessageCircle, "Chats", "/dashboard/chats"],
  [Telescope, "Explore", "/dashboard/explore"],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { activeId } = useLingov();
  const active = (href: string) => (href === "/dashboard" ? path === href : path.startsWith(href));
  // Mobile: an open chat is full screen (prototype showTabs = !dk && !open).
  const hideTabs = path === "/dashboard/chats" && activeId != null;

  // In Chats the sidebar stays icon-only to leave room for the conversation and opens over it while hovered or focused.
  const inChats = path.startsWith("/dashboard/chats");
  const [peek, setPeek] = useState(false);

  return (
    <SidebarProvider
      open={!inChats || peek}
      onOpenChange={(o) => inChats && setPeek(o)}
      style={{ "--sidebar-width": "15rem", "--sidebar-width-icon": "4.5rem" } as React.CSSProperties}
      className="h-dvh min-h-0 flex-col bg-[#0D0F0E] dk:flex-row"
    >
      <AppSidebar
        overlay={inChats}
        onMouseEnter={() => inChats && setPeek(true)}
        onMouseLeave={() => inChats && setPeek(false)}
        onFocus={() => inChats && setPeek(true)}
        onBlur={(e) => inChats && !e.currentTarget.contains(e.relatedTarget) && setPeek(false)}
      />

      <main className="flex min-h-0 min-w-0 flex-1">{children}</main>

      <nav className={cn("h-[76px] flex-none border-t border-[#2A2F2D] bg-[#171A19] px-2 pb-[18px] pt-[6px] dk:hidden", hideTabs ? "hidden" : "flex")}>
        {TABS.map(([Icon, label, href]) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            className={cn("flex flex-1 cursor-pointer flex-col items-center justify-center gap-[3px] border-0 bg-transparent text-[11px] font-medium", active(href) ? "text-[#52C79A]" : "text-[#A3ABA7]")}
          >
            <span className={cn("flex h-7 w-[52px] items-center justify-center rounded-full text-[18px] transition-[background] duration-150", "bg-transparent")}><Icon size={18} /></span>
            {label}
          </button>
        ))}
      </nav>
    </SidebarProvider>
  );
}

function AppSidebar({ overlay, ...hover }: { overlay: boolean } & Omit<React.ComponentProps<"div">, "children">) {
  const router = useRouter();
  const path = usePathname();
  const { state } = useSidebar();
  const { S, set, me, openReading, openWriting } = useLingov();
  const wide = state === "expanded";
  const active = (href: string) => (href === "/dashboard" ? path === href : path.startsWith(href));

  const onPractice = path === "/dashboard/practice";
  const goPractice = (pt: number) => { set({ pt }); router.push("/dashboard/practice"); };
  const subs: [LucideIcon, string, boolean, () => void][] = [
    [Glasses, "Reading", path.startsWith("/dashboard/practice/reading"), openReading],
    [Feather, "Writing", path.startsWith("/dashboard/practice/writing"), openWriting],
    [BookA, "Vocabulary", onPractice && S.pt === 0, () => goPractice(0)],
    [Puzzle, "Grammar", onPractice && S.pt === 1, () => goPractice(1)],
  ];
  const subActive = subs.some(([, , on]) => on);

  return (
    <Sidebar collapsible="icon" overlay={overlay} className="border-[#2A2F2D] bg-[#171A19]" {...hover}>
      <SidebarHeader className="px-4 pb-3 pt-6"><BrandMark size={32} word={wide} /></SidebarHeader>

      <SidebarContent className="px-0 py-1">
        <SidebarGroup className="px-3">
          <SidebarGroupLabel className="px-3 text-[11.5px] font-bold tracking-[.04em] text-[#A3ABA7]">MENU</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {MAIN.map(([Icon, label, href]) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton className={row} isActive={active(href)} onClick={() => router.push(href)}><Icon /><span>{label}</span></SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton className={row} isActive={onPractice && !subActive} onClick={() => router.push("/dashboard/practice")}><Rocket /><span>Practice</span></SidebarMenuButton>
                <SidebarMenuSub className="mx-[22px] mt-1 gap-0.5 border-[#2A2F2D] pl-2.5 pr-0">
                  {subs.map(([Icon, label, on, go]) => (
                    <SidebarMenuSubItem key={label}>
                      <SidebarMenuSubButton render={<button type="button" />} className={subRow} isActive={on} onClick={go}><Icon /><span>{label}</span></SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton className={row} isActive={active("/dashboard/profile")} onClick={() => router.push("/dashboard/profile")}><User /><span>Profile</span></SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 px-3 pb-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-2.5 rounded-2xl border-0 bg-transparent p-1.5 text-left outline-none transition-colors hover:bg-[#212524] focus-visible:ring-2 focus-visible:ring-[#52C79A]/60 data-popup-open:bg-[#212524] group-data-[collapsible=icon]:justify-center">
            <span className="flex size-9 flex-none items-center justify-center rounded-full bg-[#EDBF73] text-[14px] font-bold text-[#2A1800]"><Pic image={me.image} initial={me.initial} /></span>
            <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
              <span className="truncate text-[14px] font-bold">{me.name}</span>
              <span className="truncate text-[12px] text-[#A3ABA7]">{me.email}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-56 border border-[#2A2F2D] bg-[#171A19]">
            <div className="flex flex-col px-2 py-1.5">
              <span className="truncate text-[13.5px] font-bold">{me.name}</span>
              <span className="truncate text-[12px] text-[#A3ABA7]">{me.email}</span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={async () => { await signOut(); router.push("/"); }}><LogOut />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// Scroll column used by Home / Explore / Practice / Profile (prototype homePad / homeMax).
export const pageCol = "min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden w-full mx-auto px-5 pt-3 pb-5 dk:max-w-[1120px] dk:px-8 dk:pt-8 dk:pb-12 animate-[lgup_.25s_ease-out]";
