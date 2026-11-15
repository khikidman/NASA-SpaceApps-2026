"use client";
import Link from "next/link";
import { useEffect, useMemo, useReducer, useState } from "react";
import { HudDialog } from "@/components/hud-dialog";
import { HudIcon } from "@/components/hud-icon";
import { GameArt, type Art } from "@/components/game-art";
import { ResourceMeter } from "@/components/resource-meter";
import { ResourceEffects } from "@/components/resource-effects";
import { getDailyEvent } from "@/data/events";
import { DAILY_KNOWLEDGE_GOAL, MISSIONS } from "@/data/missions";
import { TASKS, getTask } from "@/data/tasks";
import { getSource } from "@/data/sources";
import { canEndDay, completedTasks, previewNight } from "@/game/engine";
import { RESOURCE_KEYS, type GameAction, type GameState, type TutorialTaskId } from "@/game/types";
import { createOutpost } from "@/world/map";
import { adjacent } from "@/world/exploration";
import type { InteractionFeedback, MissionTarget } from "@/world/types";
import { MissionWorld } from "@/features/world/mission-world";
import { NodePanel } from "./node-panel";
import { MISSION_VISUALS } from "./visual-content";
import { useMission } from "./use-mission";
import { DAY1_TASKS, isDayOne, nextDayOneTask } from "@/data/day-one";
import { DayOnePanel, ExercisePanel } from "./day-one-panel";
import { DayOneStrip, DayOneRecap } from "./day-one-strip";
type Panel = "intro" | "tutorial" | "exercise" | "day1-recap" | "today" | "book" | "help" | `node:${string}` | null;
export function MissionDashboard() {
  const { game, ready, notice, error, feedback, act, restart, clearError, saveBlocked } = useMission();
  const [panel, setPanel] = useState<Panel>(null), [dismissedResult, setDismissedResult] = useState<string | null>(null);
  const [target, setTarget] = useState<MissionTarget | null>(null), [displayNotice, setDisplayNotice] = useState("");
  const [tutorialTask, setTutorialTask] = useState<TutorialTaskId>("comms");
  const [introDismissed, setIntroDismissed] = useState(false), [recapSeen, setRecapSeen] = useState(false);
  const dayOne = isDayOne(game), nextTask = nextDayOneTask(game);
  const [homeWorld, setHomeWorld] = useState<string | null>(null);
  const worldKey = `${game.seed}-${game.missionId}`, insideHome = homeWorld === worldKey;
  const mission = MISSIONS[game.missionId], ended = game.status !== "playing";
  const world = useMemo(() => createOutpost(game.seed, game.missionId, dayOne), [game.seed, game.missionId, dayOne]);
  const resultKey = `${game.missionId}-${game.status}-${game.day}`, activePanel = ready && dayOne && !introDismissed && !game.actions.length ? "intro" : !recapSeen && game.missionId === "moon" && game.day === 2 && game.history.some(t => t.world === "moon" && t.day === 1) ? "day1-recap" : ended && dismissedResult !== resultKey ? "today" : panel;
  const node = activePanel?.startsWith("node:") ? world.entities.find((n) => n.id === activePanel.slice(5)) : undefined;
  const title = activePanel === "intro" ? "Welcome to the Moon" : activePanel === "day1-recap" ? "Day 1 complete" : activePanel === "tutorial" ? DAY1_TASKS.find(t => t.id === tutorialTask)!.title : activePanel === "exercise" ? "Move a little" : activePanel === "today" ? ended ? "Your journey" : "Night plan" : activePanel === "book" ? "My discoveries" : activePanel === "help" ? "Play your way" : node?.interaction.type === "task" ? getTask(game.missionId, node.interaction.taskId).title : "Home base";
  const currentTarget = target?.world === game.missionId ? target : null;
  function open(next: Panel) { clearError(); setPanel(next); }
  function close() { setIntroDismissed(true); setRecapSeen(true); setPanel(null); setDismissedResult(ended ? resultKey : null); clearError(); requestAnimationFrame(() => document.querySelector<HTMLCanvasElement>("canvas")?.focus({ preventScroll: true })); }
  function freshTrip() { restart(); setIntroDismissed(false); setRecapSeen(false); setTarget(null); setPanel(null); setDismissedResult(null); setHomeWorld(null); }
  function openNode(id: string) {
    if (dayOne && id === "tutorial:exercise" && !nextTask) { open("exercise"); return; }
    if (dayOne && nextTask && id === `tutorial:${nextTask.id}`) { setTutorialTask(nextTask.id); open("tutorial"); return; }
    const node = world.entities.find((n) => n.id === id);
    if (dayOne) {
      const task = DAY1_TASKS.find(t => t.nodeId === id && t.id === nextTask?.id);
      if (task) { setTutorialTask(task.id); open("tutorial"); return; }
      if (node?.interaction.type === "task" || id === "sample-01") return;
    }
    if (node?.interaction.type === "resource") { clearError(); act({ type: "collect", nodeId: id }); }
    else open(node?.interaction.type === "base" ? "today" : `node:${id}`);
  }
  function selectMission(id: string) {
    const node = world.entities.find((n) => n.interaction.type === "task" && n.interaction.taskId === id)!;
    if (adjacent(game.position, node.position)) open(`node:${node.id}`);
    else { clearError(); setTarget({ nodeId: node.id, request: (target?.request ?? 0) + 1, world: game.missionId }); close(); }
  }
  function goDayOne() {
    if (insideHome && (nextTask?.inside || !nextTask)) {
      if (nextTask) { setTutorialTask(nextTask.id); open("tutorial"); } else open("exercise");
      return;
    }
    const nodeId = nextTask?.nodeId ?? "hab-01";
    const taskNode = world.entities.find(n => n.id === nodeId)!;
    if (nextTask && !nextTask.inside && adjacent(game.position, taskNode.position)) { setTutorialTask(nextTask.id); open("tutorial"); }
    else { clearError(); setTarget({ nodeId, request: (target?.request ?? 0) + 1, world: game.missionId }); close(); }
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector("main")?.requestFullscreen(); }
    catch { setDisplayNotice("Full screen is unavailable in this window."); }
  }
  return <main className="game-shell junior-game play-ui" data-world={game.missionId} data-location={insideHome ? "home" : "surface"}>
    <h1 className="sr-only">{mission.location} mission</h1>
    {ready && <MissionWorld game={game} act={act} onOpen={openNode} feedback={feedback} target={currentTarget} onHomeChange={(value) => { setHomeWorld(value ? worldKey : null); if (value) setTarget(null); }} />}
    <header className="minimal-header">
      <div className="minimal-supplies" role="group" aria-label="Your supplies and knowledge">{RESOURCE_KEYS.filter(resource => !dayOne || resource === "power" || resource === "oxygen" && game.steps > 0 || (resource === "energy" || resource === "science") && game.tutorial.completed.length >= 1 || resource === "water" && game.tutorial.completed.length >= 2).map((resource) => <ResourceMeter key={resource} resource={resource} value={game.resources[resource]} />)}</div>
      <div className="top-corner">{dayOne && <span className={`exposure-guide ${insideHome ? "sheltered" : "outside"}`} role="status" title="Game exposure guide; not a measured radiation dose">{insideHome ? "⌂ Sheltered" : "☀ Outside"}</span>}<div className="day-badge"><GameArt name={game.missionId} size={34} /><span>{mission.location}<small>Day {game.day} / 7</small></span><div className="day-dots" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} className={i < game.day ? "filled" : ""} />)}</div></div><nav className="utility-buttons" aria-label="More game options"><button className="icon-button" aria-label="My book" onClick={() => open("book")}><HudIcon name="journal" /></button><button className="icon-button" aria-label="Help" onClick={() => open("help")}><HudIcon name="guide" /></button></nav></div>
    </header>
    {dayOne ? <DayOneStrip game={game} inside={insideHome} onGo={goDayOne} onRest={() => open("today")} /> : (
    <section className="mission-strip" aria-label="Missions">
      <div className="mission-strip-top"><span className="daily-star-pips" role="progressbar" aria-label="Knowledge earned today" aria-valuemin={0} aria-valuemax={DAILY_KNOWLEDGE_GOAL} aria-valuenow={Math.min(game.dayKnowledge, DAILY_KNOWLEDGE_GOAL)}>{Array.from({ length: DAILY_KNOWLEDGE_GOAL }, (_, i) => <span key={i} className={i < game.dayKnowledge ? "filled" : ""} aria-hidden="true">✦</span>)}</span><span className={`daily-check ${completedTasks(game) ? "done" : ""}`} title="Finish one mission" aria-label={`${completedTasks(game)} missions finished today`}>✓</span><span className="work-clock" aria-label={`${game.timeLeft} work hours left`}>◷ {game.timeLeft}</span><button className={`night-button ${canEndDay(game) ? "night-ready" : ""}`} aria-label="Night plan" onClick={() => open("today")}><GameArt name="dark" size={28} /><span>Rest</span></button></div>
      {!insideHome && <div className="mission-buttons">{TASKS[game.missionId].map((task) => { const visual = MISSION_VISUALS[task.id], progress = game.taskProgress[task.id] ?? 0; const node = world.entities.find((n) => n.interaction.type === "task" && n.interaction.taskId === task.id)!; return <button type="button" key={task.id} className={`mission-button ${progress >= 2 ? "mission-done" : ""} ${currentTarget?.nodeId === node.id ? "mission-selected" : ""}`} disabled={ended} aria-label={`${task.title}, ${progress} of 2 steps complete`} onClick={() => selectMission(task.id)}><GameArt name={visual.art} size={42} /><span>{visual.label}</span><span className="mission-step-dots" aria-hidden="true">{[0, 1].map((i) => <i key={i} className={i < progress ? "filled" : ""} />)}</span>{progress >= 2 && <b className="mission-tick">✓</b>}</button>; })}</div>}
    </section>
    )}
    {feedback && <ActionToast key={feedback.id} feedback={feedback} />}
    {!activePanel && saveBlocked && <button className="small-notice" onClick={() => open("help")}>Saving needs attention ⓘ</button>}
    {!activePanel && error && <button className="small-notice" onClick={() => open("help")} aria-label={error}>Need a hand? <HudIcon name="guide" size={16} /></button>}
    {displayNotice && <div className="game-toast" role="status"><p>{displayNotice}</p><button className="icon-button" aria-label="Dismiss notification" onClick={() => setDisplayNotice("")}><HudIcon name="close" /></button></div>}
    <HudDialog open={!!activePanel} title={title} eyebrow="" onClose={close} className={node ? "visual-dialog" : "compact-dialog"}>
      {activePanel === "intro" && <section className="tutorial-success landing-story"><GameArt name="home" size={115} /><h3>We landed!</h3><p>A moonquake shook the base.</p><p className="small-copy">Mission Control is checking what happened.</p><div className="intro-picture-route"><GameArt name="radio" size={58} /><span>→</span><GameArt name="sensor" size={58} /><span>→</span><GameArt name="water" size={58} /></div><button className="primary-button" onClick={() => { close(); }}>Let’s fix the radio →</button></section>}
      {activePanel === "tutorial" && <DayOnePanel key={tutorialTask} game={game} taskId={tutorialTask} act={act} onClose={close} />}
      {activePanel === "exercise" && <ExercisePanel game={game} act={act} onClose={() => open("today")} />}
      {activePanel === "day1-recap" && <DayOneRecap game={game} onClose={close} />}
      {activePanel === "today" && (ended ? <section className="visual-complete"><GameArt name={game.status === "lost" ? "home" : "star"} size={110} className="reward-star" /><h3>{game.status === "level-complete" ? "Moon complete!" : game.status === "won" ? "Two worlds explored!" : "Let’s try again"}</h3><div className="journey-score">{game.knowledgeEarned} <span>✦ learned</span></div>{game.status === "level-complete" ? <><div className="travel-plan"><GameArt name="moon" /><span>→</span><GameArt name="mars" /></div><ResourceEffects effects={Object.fromEntries(RESOURCE_KEYS.filter((k) => k !== "science").map((k) => [k, MISSIONS.mars.capacity[k] - game.resources[k]]))} compact /><button className="primary-button" onClick={() => { act({ type: "travel" }); setTarget(null); setPanel(null); setDismissedResult(null); }}>Fly to Mars ↗</button></> : <><p>{game.status === "lost" ? "Visit supply stops before a tank runs out." : "Look at everything you learned."}</p><button className="primary-button" onClick={freshTrip}>New Moon trip →</button></>}</section> : <NightPlan game={game} act={act} onExplore={close} />)}
      {node && <NodePanel game={game} node={node} act={act} onToday={() => open("today")} onClose={close} />}
      {activePanel === "book" && <section className="learning-panel"><div className="journey-score">{game.knowledgeEarned} <span>✦ learned</span></div>{!game.discoveries.length && <div className="visual-complete"><GameArt name="notes" size={100} /><p>Try a mission to make your first discovery.</p></div>}{game.discoveries.map((d, i) => <article className="discovery-card" key={i}><small>{MISSIONS[d.world].location} · day {d.day}</small><p>{d.fact}</p><a href={getSource(d.sourceId).url} target="_blank" rel="noreferrer">NASA ↗</a></article>)}<details className="science-note"><summary>My days in space</summary>{game.history.map((turn) => <p key={`${turn.world}-${turn.day}`}>{MISSIONS[turn.world].location} · {turn.day}: {turn.choiceLabel} · +{turn.knowledge} ✦</p>)}</details></section>}
      {activePanel === "help" && <section className="learning-panel"><div className="picture-help"><div><GameArt name="home" /><strong>Tap to walk</strong></div><div><GameArt name="jar" /><strong>Collect supplies</strong></div><div><GameArt name="sensor" /><strong>Try a mission</strong></div></div><p>Tap a stop, then use its action button or <kbd>E</kbd>. Arrows / WASD also move. Drag to look around.</p><div className="help-goal"><span>6 ✦</span><span>+ 1 ✓</span><span>→ ☾</span></div><p>{dayOne ? "Follow five markers, then choose your routine." : "Earn 6 stars and finish one mission each day. Complete 7 Moon days, then fly to Mars."}</p><p><span className="effect gain">+ Gain</span> <span className="effect loss">− Use</span> Hints and wrong answers use no supplies.</p>{!dayOne && <details className="science-note"><summary>Get a learning boost</summary><p>{getDailyEvent(game).fact}</p><ResourceEffects effects={{ science: 2, oxygen: -1 }} hours={2} compact /><button className="primary-button" disabled={game.learnedToday || game.timeLeft < 2 || game.resources.oxygen < 2 || ended} onClick={() => act({ type: "learn" })}>{game.learnedToday ? "✓ Read today" : "Learn +2 ✦"}</button></details>}<div className="settings-row"><button className="icon-button" aria-label="Toggle full screen" onClick={fullscreen}><HudIcon name="fullscreen" /></button><span className="small-copy">{notice}</span></div><details className="science-note"><summary>Start a fresh adventure</summary><p>This resets your saved trip, score, and discovery book.</p><button className="primary-button" onClick={freshTrip}>Start again on the Moon →</button></details><Link className="source-link" href="/about">Sources &amp; game rules ↗</Link></section>}
      {activePanel && error && <div key={feedback?.id} className="retry-feedback" role="alert"><span>↻ Try another plan</span><details><summary>Show hint</summary><p>{error}</p></details></div>}
    </HudDialog>
  </main>;
}
function NightPlan({ game, act, onExplore }: { game: GameState; act: (action: GameAction) => void; onExplore(): void }) {
  const event = getDailyEvent(game);
  const art: Art = event.id === "moonquake" ? "sensor" : event.id === "sun-alert" ? "sun" : event.id === "mars-dust" ? "dust" : event.id === "water-low" ? "water" : event.id === "power-low" ? "battery" : "home";
  const ready = canEndDay(game), tutorial = isDayOne(game);
  return <section className="visual-night"><GameArt name={art} size={88} /><h3>{tutorial ? "Ready for tomorrow?" : event.title}</h3>{tutorial && <p className="task-cue">{game.tutorial.completed.length} / 5 missions · {game.tutorial.exercise === "pending" ? "Choose exercise or skip" : game.tutorial.fatigue ? "Tomorrow: 80 Energy" : "Routine done ✓"}</p>}{!ready && <>{tutorial ? <p className="task-cue">Finish your mission strip first.</p> : <div className="help-goal"><span className={game.dayKnowledge >= 6 ? "done" : ""}>{Math.min(game.dayKnowledge, 6)} / 6 ✦</span><span className={completedTasks(game) ? "done" : ""}>{Math.min(completedTasks(game), 1)} / 1 ✓</span></div>}<button className="primary-button" onClick={onExplore}>Try a mission →</button></>}<div className="night-cards">{event.choices.map((c, i) => { const preview = previewNight(game, c.id), unsafe = preview.resources.oxygen === 0 || preview.resources.water === 0 || preview.resources.power === 0; const choiceArt: Art = c.id === "recycle" || c.id === "clean" || c.id === "careful" ? "water" : c.id === "notes" ? "radio" : c.id === "shelter" || c.id === "secure" ? "shield" : c.id === "panels" ? "solar" : i === 0 ? "tools" : "notes"; return <button type="button" className="night-picture" key={c.id} disabled={!ready || !preview.affordable || unsafe} aria-label={`${c.label}, finish day ${game.day}`} onClick={() => act({ type: "end-day", choiceId: c.id })}><GameArt name={choiceArt} size={68} /><strong>{c.label}</strong><span className="sr-only">{c.description} Total changes, including daily supplies, report, decision, and reflection:</span><small className="night-total">Tonight</small><ResourceEffects effects={preview.effects} compact /><span className="night-choose">☾ Rest</span>{unsafe && <small>Collect more supplies first</small>}</button>; })}</div><details className="science-note"><summary>What happens tonight?</summary><p>{event.description}</p><p>{tutorial ? "Your choices change tomorrow’s supplies." : event.fact}</p><p>Each report costs 2 stars, each choice costs 1, and reflection rewards 2. Above: all changes after the plan, event, and daily supplies. Unused work hours pass during rest.</p></details></section>;
}

function ActionToast({ feedback }: { feedback: InteractionFeedback }) {
  const [visible, dismiss] = useReducer(() => false, true);
  useEffect(() => { const timer = setTimeout(dismiss, 2100); return () => clearTimeout(timer); }, []);
  if (!visible) return null;
  return <div className={`action-toast ${feedback.success ? "success" : "retry"}`} role="status"><span className="action-toast-symbol">{feedback.success ? "✦" : "↻"}</span><ResourceEffects effects={feedback.effects} compact />{!feedback.success && <span>Try another plan</span>}</div>;
}
