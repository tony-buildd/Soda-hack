"use client";

import { useRef, useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

export function VideoBackground() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const lightRef = useRef<HTMLVideoElement>(null);
  const darkRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  // Start playing both videos on mount so they're always buffered.
  // We toggle visibility via opacity — no reload flicker.
  useEffect(() => {
    const playBoth = async () => {
      try {
        await lightRef.current?.play();
        await darkRef.current?.play();
      } catch {
        // Autoplay blocked — videos will still show first frame
      }
      setReady(true);
    };
    playBoth();
  }, []);

  const baseClasses =
    "fixed inset-0 -z-10 h-full w-full object-cover transition-opacity duration-700 ease-in-out";

  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      {/* Light video */}
      <video
        ref={lightRef}
        muted
        loop
        autoPlay
        playsInline
        className={baseClasses}
        style={{ opacity: ready && !isDark ? 0.4 : 0 }}
      >
        <source src="/light_background.mp4" type="video/mp4" />
      </video>

      {/* Dark video */}
      <video
        ref={darkRef}
        muted
        loop
        autoPlay
        playsInline
        className={baseClasses}
        style={{ opacity: ready && isDark ? 0.4 : 0 }}
      >
        <source src="/dark_background.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
