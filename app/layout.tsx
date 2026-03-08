import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";
import { GlassNav } from "@/components/glass-nav";
import { VideoBackground } from "@/components/video-background";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Teacher Allocation Optimizer",
  description: "Optimize teacher-to-school allocation using Min-Cost Max-Flow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <ThemeScript />
      </head>
      <body className="font-sans antialiased pb-24 text-lg">
        <ThemeProvider>
          <VideoBackground />
          <main className="relative z-1">
            {children}
          </main>
          <GlassNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
