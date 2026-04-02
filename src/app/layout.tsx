import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Touch Everything - AI Coding Assistant",
  description: "Touch Everything: A Claude Code-inspired web interface for AI-powered coding. Interact with code through natural language, slash commands, and intelligent tool use.",
  keywords: ["Touch Everything", "Claude Code", "AI", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "coding assistant", "NVIDIA NIM"],
  authors: [{ name: "dav-niu474" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Touch Everything",
    description: "AI-powered coding assistant - Claude Code for the Web",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Touch Everything",
    description: "AI-powered coding assistant - Claude Code for the Web",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
