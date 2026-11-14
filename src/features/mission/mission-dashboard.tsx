"use client";

import Link from "next/link";
import { ResourceMeter } from "@/components/resource-meter";
import { MissionWorld } from "@/features/world/mission-world";
import { getEvent } from "@/data/events";
import { getSource } from "@/data/sources";
import { canAfford, getChoices, getMission } from "@/game/engine";
import { RESOURCE_KEYS, type ResourceDelta } from "@/game/types";
import { useMission } from "./use-mission";

function Effects({ effects }: { effects: ResourceDelta }) {
  return <span className="effects">{RESOURCE_KEYS.filter((key) => effects[key]).map((key) => (
    <span key={key} className={(effects[key] ?? 0) > 0 ? "effect-positive" : "effect-negative"}>
      {(effects[key] ?? 0) > 0 ? "+" : ""}{effects[key]} {key === "shielding" ? "shield" : key}
    </span>
  ))}</span>;
}

export function MissionDashboard() {
  const { game, ready, notice, error, choose, restart, replay } = useMission();
  if (!ready) return <main className="loading" role="status">Connecting to your outpost…</main>;

  const mission = getMission(game.missionId);
  const event = getEvent(game.eventId);
  const source = getSource(event.sourceId);
  const lastTurn = game.history.at(-1);
  const finished = game.status !== "playing";
  const progress = Math.round((game.history.length / mission.duration) * 100);

  return (
    <main className="mission-shell">
      <header className="topbar">
        <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true">✦</span><span>JUNIOR ASTRONAUT<small>MISSION TRAINER</small></span></Link>
        <nav aria-label="Main navigation"><Link href="/about">The science behind it <span aria-hidden="true">↗</span></Link></nav>
      </header>

      <section className="mission-intro" aria-labelledby="mission-title">
        <div><p className="eyebrow"><span className="status-dot" /> MARS OUTPOST / TRAINING MISSION 01</p><h1 id="mission-title">A home on <span>Mars.</span></h1><p className="intro-copy">Big discoveries. Small decisions. Keep your crew safe for 15 sols.</p></div>
        <div className="sol-indicator"><span>CURRENT SOL</span><strong>{String(game.day).padStart(2, "0")}<small> / {mission.duration}</small></strong><span>A sol is one Martian day.</span></div>
      </section>

      <section className="resources-grid" aria-label="Outpost resources">
        {RESOURCE_KEYS.map((resource) => <ResourceMeter key={resource} resource={resource} value={game.resources[resource]} />)}
      </section>

      <MissionWorld game={game} />

      <div className="mission-grid">
        <section className="event-panel panel" aria-labelledby="event-title">
          {finished ? (
            <div className="result" aria-live="polite">
              <p className="eyebrow">MISSION {game.status === "won" ? "COMPLETE" : "DEBRIEF"}</p>
              <h2 id="event-title">{game.status === "won" ? "You made a home among the stars." : "Every explorer learns along the way."}</h2>
              <p>{game.status === "won" ? `Your crew completed all ${mission.duration} sols and earned ${game.resources.science} science points.` : `Your ${game.resources.oxygen === 0 ? "oxygen" : "power"} ran out at the end of sol ${game.day}. Try building a bigger reserve before taking on extra science.`}</p>
              <button className="primary-button" onClick={restart}>Start a new mission <span aria-hidden="true">↗</span></button>
              <button className="text-button" onClick={replay}>Retry the same event sequence</button>
            </div>
          ) : (
            <>
              <div className="panel-heading"><p className="eyebrow">TODAY’S CHALLENGE</p><span className="category-tag">{event.category}</span></div>
              <h2 id="event-title">{event.title}</h2>
              <p className="event-description">{event.description}</p>
              <p className="choice-prompt">Commander, what’s the plan?</p>
              <div className="choices">
                {getChoices(game).map((choice, index) => {
                  const available = canAfford(game.resources, choice);
                  return <button className="choice" key={choice.id} disabled={!available} onClick={() => choose(choice.id)}>
                    <span className="choice-number" aria-hidden="true">0{index + 1}</span>
                    <span className="choice-content"><strong>{choice.label}</strong><span>{choice.description}</span><Effects effects={choice.effects} />{!available && <span className="unavailable">Not enough supplies</span>}</span>
                    <span className="choice-arrow" aria-hidden="true">↗</span>
                  </button>;
                })}
              </div>
              <div className="upkeep"><span aria-hidden="true">↻</span><span>Every sol: <strong>−6 oxygen</strong> for your crew, <strong>+8 power</strong> from solar generation. Event effects also apply. Keep oxygen and power above zero at the end of each sol.</span></div>
            </>
          )}
          {error && <p className="error-message" role="alert">{error}</p>}
        </section>

        <aside className="sidebar">

          <section className="panel fact-panel" aria-labelledby="fact-title"><p className="eyebrow">A LITTLE SPACE KNOW-HOW</p><h3 id="fact-title">Real curiosity. Real science.</h3><p>{event.fact}</p><a href={source.url} target="_blank" rel="noreferrer">Explore with NASA <span aria-hidden="true">↗</span></a></section>

          <section className="panel progress-panel"><div><h3>Mission progress</h3><span>{game.history.length}/{mission.duration} sols</span></div><progress value={progress} max={100} aria-label={`${game.history.length} of ${mission.duration} sols complete`} /><p>Survive the mission. See how much you can discover.</p></section>
        </aside>
      </div>

      {lastTurn && <section className="panel debrief" aria-live="polite" aria-atomic="true"><p className="eyebrow">SOL {String(lastTurn.day).padStart(2, "0")} / FIELD NOTES</p><h3>{lastTurn.choiceLabel}</h3><p>{lastTurn.eventTitle}. Your choice, the event, and daily upkeep resulted in:</p><Effects effects={Object.fromEntries(RESOURCE_KEYS.map((key) => [key, lastTurn.after[key] - lastTurn.before[key]]))} />{lastTurn.shieldAbsorbed > 0 && <p>Your shield reserve absorbed {lastTurn.shieldAbsorbed} storm impact points.</p>}{lastTurn.emergencyOxygen > 0 && <p>Unshielded impact used {lastTurn.emergencyOxygen} emergency oxygen.</p>}</section>}

      <footer className="mission-footer"><div><p>{notice}</p><p>Fictional training scenarios · Game units are simplified · <Link href="/about">Sources &amp; assumptions</Link></p></div><span className="seed">MISSION SEED {game.seed}</span></footer>
    </main>
  );
}
