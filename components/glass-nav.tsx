"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { House, ClipboardText, ChartBar, Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/components/theme-provider";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/form", label: "Form", icon: ClipboardText },
  { href: "/statistics", label: "Statistics", icon: ChartBar },
] as const;

export function GlassNav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const activeIndex = NAV_ITEMS.findIndex((item) => item.href === pathname);

  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    const nav = navRef.current;
    if (!el || !nav) return;

    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({
      left: elRect.left - navRect.left,
      width: elRect.width,
    });
  }, [activeIndex]);

  const isDark = theme === "dark";

  return (
    <>
      {/* Theme toggle — top right, like the Apple screenshots */}
      <button
        onClick={toggle}
        aria-label="Toggle dark mode"
        className="fixed top-5 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300"
        style={{
          background: isDark ? "rgba(255,255,255,0.08)" : "rgba(18,49,43,0.06)",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(18,49,43,0.08)",
          boxShadow: isDark
            ? "0 2px 12px rgba(0,0,0,0.3)"
            : "0 2px 12px rgba(18,49,43,0.06)",
        }}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={18} weight="bold" className="text-gold" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={18} weight="bold" className="text-muted" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Floating pill nav — bottom center */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div
          ref={navRef}
          className="relative flex items-center gap-1 rounded-full px-1.5 py-1.5 transition-colors duration-300"
          style={{
            background: isDark ? "rgba(17, 26, 22, 0.75)" : "rgba(255, 255, 255, 0.55)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            border: isDark
              ? "1px solid rgba(52, 211, 153, 0.12)"
              : "1px solid rgba(255, 255, 255, 0.45)",
            boxShadow: isDark
              ? "0 8px 40px rgba(0, 0, 0, 0.3), 0 1.5px 4px rgba(0, 0, 0, 0.2), inset 0 0.5px 0 rgba(255, 255, 255, 0.05)"
              : "0 8px 40px rgba(18, 49, 43, 0.08), 0 1.5px 4px rgba(18, 49, 43, 0.04), inset 0 0.5px 0 rgba(255, 255, 255, 0.6)",
          }}
        >
          {/* Sliding indicator */}
          {indicator.width > 0 && (
            <motion.div
              className="absolute top-1.5 h-[calc(100%-12px)] rounded-full transition-colors duration-300"
              style={{
                background: isDark ? "rgba(52, 211, 153, 0.12)" : "rgba(255, 255, 255, 0.85)",
                boxShadow: isDark
                  ? "0 2px 12px rgba(0, 0, 0, 0.2), inset 0 0.5px 0 rgba(52, 211, 153, 0.1)"
                  : "0 2px 12px rgba(18, 49, 43, 0.08), 0 0.5px 2px rgba(18, 49, 43, 0.06), inset 0 0.5px 0 rgba(255, 255, 255, 0.9)",
              }}
              animate={{
                left: indicator.left,
                width: indicator.width,
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 30,
                mass: 0.8,
              }}
            />
          )}

          {NAV_ITEMS.map(({ href, label, icon: Icon }, i) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                ref={(el) => { itemRefs.current[i] = el; }}
                className={cn(
                  "relative z-10 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium no-underline transition-colors duration-200",
                  isActive
                    ? "text-ink"
                    : "text-muted/60 hover:text-muted"
                )}
              >
                <Icon size={18} weight={isActive ? "fill" : "regular"} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
