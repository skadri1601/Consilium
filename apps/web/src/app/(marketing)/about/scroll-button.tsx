"use client";

export function ScrollButton() {
  return (
    <button
      onClick={() => document.getElementById("about-content")?.scrollIntoView({ behavior: "smooth" })}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer z-10"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 hover:opacity-100 transition-opacity">
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    </button>
  );
}
