"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, ClipboardList, BarChart3 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/form", label: "Form", icon: ClipboardList },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
] as const;

export function GlassNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-nav sticky top-0 z-50 w-full px-8 py-3">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-2 text-white text-sm font-bold">
            TA
          </div>
          <span className="text-base font-bold text-ink tracking-tight">Teacher Allocator</span>
        </Link>
        <div className="flex gap-1 rounded-xl bg-white/30 p-1 border border-white/20">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all no-underline",
                pathname === href
                  ? "bg-white/70 text-accent-2 shadow-sm"
                  : "text-muted hover:text-ink hover:bg-white/30"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
