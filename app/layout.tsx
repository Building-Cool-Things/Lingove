import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-sans" });

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
      className={cn("dark h-full antialiased font-sans", outfit.variable)}
    >
      <body className="min-h-full flex flex-col bg-background">{children}</body>
    </html>
  );
}
