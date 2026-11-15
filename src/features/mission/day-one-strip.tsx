"use client";
import { GameArt } from "@/components/game-art";
import { ResourceEffects } from "@/components/resource-effects";
import { DAY1_TASKS, nextDayOneTask } from "@/data/day-one";
import { MISSIONS } from "@/data/missions";
import { canEndDay } from "@/game/engine";
import type { GameState } from "@/game/types";

export function DayOneStrip({ game, inside, onGo, onRest }: { game: GameState; inside: boolean; onGo(): void; onRest(): void }) {
  const task = nextDayOneTask(game), routine = !task && game.tutorial.exercise === "pending";
  const art = task?.id === "comms" ? "radio" : task?.id === "detector" ? "sensor" : task?.id === "ice" ? "water" : task?.id === "food" ? "tools" : task?.id === "melt" ? "water" : routine ? "sun" : "check";
  return <section className="mission-strip day-one-strip" aria-label="Day 1 missions"><div className="mission-strip-top"><span className="day-one-progress" aria-label={`${game.tutorial.completed.length} of 5 missions complete`}>{DAY1_TASKS.map((t, i) => <i key={t.id} className={game.tutorial.completed.includes(t.id) ? "done" : task?.id === t.id ? "current" : ""}>{game.tutorial.completed.includes(t.id) ? "✓" : i + 1}</i>)}</span><span className="work-clock" aria-label={`${game.timeLeft} work hours left`}>◷ {game.timeLeft}</span><button className={`night-button ${canEndDay(game) ? "night-ready" : ""}`} onClick={onRest}><GameArt name="dark" size={24} />Rest</button></div><button className="day-one-goal" disabled={game.status !== "playing"} onClick={canEndDay(game) ? onRest : onGo}><GameArt name={art} size={48} /><span><strong>{task?.title ?? (routine ? "Choose your routine" : "Day 1 ready!")}</strong><small>{task?.inside && !inside || routine && !inside ? "Enter your base ↙" : task?.inside || routine ? "Try it at home →" : "Follow the bright marker ↗"}</small></span><b>{task ? "→" : "✓"}</b></button></section>;
}
export function DayOneRecap({ game, onClose }: { game: GameState; onClose(): void }) {
  const day = game.history.find(t => t.world === "moon" && t.day === 1);
  if (!day) return null;
  const effects = Object.fromEntries(Object.entries(day.after).map(([key, value]) => [key, value - MISSIONS.moon.initialResources[key as keyof typeof day.after]]));
  return <section className="tutorial-success day-one-recap"><GameArt name="star" size={90} /><h3>Your base is working!</h3><div className="day-one-progress">{DAY1_TASKS.map(t => <i className="done" key={t.id} title={t.title}>✓</i>)}</div><div className="journey-score">+{day.knowledge}<span>✦ learned</span></div><div className="recap-resource-bars">{Object.entries(effects).filter(([key]) => key !== "science").map(([key, delta]) => <div key={key}><ResourceEffects effects={{ [key]: delta }} compact /><span className={delta >= 0 ? "gain" : "loss"} style={{ width: `${Math.max(3, Math.min(100, Math.abs(delta)))}%` }} /></div>)}</div>{game.tutorial.fatigue && <p>Routine skipped · {game.resources.energy} Energy this morning.</p>}<button className="primary-button" onClick={onClose}>Day 2 →</button></section>;
}
