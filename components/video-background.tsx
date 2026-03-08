"use client";

import { useRef, useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

export function VideoBackground() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const lightRef = useRef<HTMLVideoElement>(null);
  const darkRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

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

  const videoClasses =
    "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out";

  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      {/* Light video */}
      <video
        ref={lightRef}
        muted
        loop
        autoPlay
        playsInline
        className={videoClasses}
        style={{ opacity: ready && !isDark ? 0.35 : 0 }}
      >
        <source src="/vietnam_background.mp4" type="video/mp4" />
      </video>

      {/* Dark video */}
      <video
        ref={darkRef}
        muted
        loop
        autoPlay
        playsInline
        className={videoClasses}
        style={{ opacity: ready && isDark ? 0.35 : 0 }}
      >
        <source src="/vietnam_background.mp4" type="video/mp4" />
      </video>

      {/* Thin tint — just enough to help text, not hide the video */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          backgroundColor: isDark
            ? "rgba(9, 14, 12, 0.3)"
            : "rgba(249, 250, 245, 0.25)",
        }}
      />
    </div>
  );
}
