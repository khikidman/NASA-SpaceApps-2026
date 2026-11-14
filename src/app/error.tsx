"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="about-shell"><p className="eyebrow">MISSION CONTROL</p><h1>A small interruption.</h1><p>We could not display the outpost. Try reconnecting to your mission.</p><button className="primary-button" onClick={reset}>Try again</button></main>;
}
