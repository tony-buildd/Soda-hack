"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  if (!hover) {
    return <div className={cn("glass-card p-4", className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("glass-card p-4", className)}
      whileHover={{ scale: 1.01, boxShadow: "0 16px 40px rgba(18,49,43,0.12)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
