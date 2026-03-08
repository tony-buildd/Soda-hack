"use client";

export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -top-32 -right-20 w-[520px] h-[520px] rounded-full opacity-25 animate-blob-drift"
        style={{ background: "radial-gradient(circle, #f5c678, transparent 70%)", filter: "blur(60px)" }}
      />
      <div
        className="absolute bottom-[-60px] -left-24 w-[440px] h-[440px] rounded-full opacity-20 animate-blob-drift-delayed"
        style={{ background: "radial-gradient(circle, #8fd4be, transparent 70%)", filter: "blur(60px)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 animate-blob-drift-slow"
        style={{ background: "radial-gradient(circle, #2f9d8f, transparent 70%)", filter: "blur(80px)" }}
      />
    </div>
  );
}
