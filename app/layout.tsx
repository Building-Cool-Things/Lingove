import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lingov",
  description: "Learn English by talking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The Lingov design is dark-only.
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={cn("dark h-full antialiased font-sans", geistMono.variable, geist.variable)}
    >
      <body className="min-h-full flex flex-col bg-[#040608]">{children}</body>
    </html>
  );
}
