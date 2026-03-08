import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { BackgroundBlobs } from "@/components/background-blobs";
import { GlassNav } from "@/components/glass-nav";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Teacher Allocation Optimizer",
  description: "Optimize teacher-to-school allocation using Min-Cost Max-Flow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="font-sans antialiased">
        <BackgroundBlobs />
        <GlassNav />
        <main className="relative z-1">
          {children}
        </main>
      </body>
    </html>
  );
}
