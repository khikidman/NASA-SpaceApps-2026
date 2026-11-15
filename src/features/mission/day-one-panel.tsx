"use client";
import { useRef, useState } from "react";
import { GameArt } from "@/components/game-art";
import { ResourceEffects } from "@/components/resource-effects";
import { DAY1_CONFIG, DAY1_TASKS } from "@/data/day-one";
import { applyEffects } from "@/game/engine";
import type { GameAction, GameState, ResourceDelta, TutorialInput, TutorialTaskId } from "@/game/types";

const centered = (value: number) => value >= 45 && value <= 55;
export function DayOnePanel({ game, taskId, act, onClose }: { game: GameState; taskId: TutorialTaskId; act(a: GameAction): void; onClose(): void }) {
  const task = DAY1_TASKS.find((t) => t.id === taskId)!;
  const [input, setInput] = useState<TutorialInput | null>(null);
  if (game.tutorial.completed.includes(taskId)) return <div className="tutorial-success"><GameArt name="check" size={90} /><h3>{taskId === "melt" ? "Base ready!" : "Nice work!"}</h3><button className="primary-button" onClick={onClose}>Keep exploring →</button></div>;
  let affordable = true, gains: ResourceDelta = {};
  try {
    const after = applyEffects(game, task.cost, task.hours, task.reward);
    gains = Object.fromEntries(Object.keys(task.cost).filter((k) => k !== "science" && (task.cost[k as keyof ResourceDelta] ?? 0) > 0).map(k => [k, after.resources[k as keyof ResourceDelta] - game.resources[k as keyof ResourceDelta]]));
    gains.science = Math.min(task.reward, 10000 - game.resources.science - (task.cost.science ?? 0));
  } catch { affordable = false; }
  const costs = Object.fromEntries(Object.entries(task.cost).filter(([, value]) => value < 0));
  return <section className="hands-on-task">
    <p className="tutorial-instruction">{task.prompt}</p>
    {task.kind === "repair" && <WireRepair onReady={setInput} />}
    {task.kind === "calibrate" && <Calibration onReady={setInput} />}
    {task.kind === "collect" && <IceCollection onReady={setInput} />}
    {task.kind === "assemble" && <MachineAssembly onReady={setInput} />}
    {task.kind === "convert" && <IceMelter ice={game.tutorial.ice} onReady={setInput} />}
    <footer className="tutorial-commit"><div><ResourceEffects effects={costs} hours={task.hours} compact /><ResourceEffects effects={gains} compact /></div><button className="primary-button" disabled={!input || !affordable} onClick={() => input && act({ type: "tutorial-submit", taskId, input })}>{input ? "Finish ✓" : "Try it above ↑"}</button></footer>
    <small className="tutorial-practice">Try freely. Supplies change only when you finish.</small>
  </section>;
}

const SHAPES = ["triangle", "circle", "square"] as const;
const GLYPH = { triangle: "▲", circle: "●", square: "■" };
function WireRepair({ onReady }: { onReady(i: TutorialInput | null): void }) {
  const [selected, select] = useState<string | null>(null), [links, link] = useState<string[]>([]), [tuning, tune] = useState(20), [wrong, miss] = useState(false);
  function refresh(next: string[], value: number) { onReady(next.length === 3 && centered(value) ? { kind: "repair", pairs: next, tuning: value } : null); }
  function connect(to: string, from = selected) {
    if (!from || links.includes(from)) return;
    if (to !== from) { miss(true); return; }
    const next = [...links, from]; link(next); select(null); miss(false); refresh(next, tuning);
  }
  return <><div className={`wire-board ${wrong ? "try-again" : ""}`}>
    <svg viewBox="0 0 320 160" aria-hidden="true">{links.map((id) => { const left = SHAPES.indexOf(id as typeof SHAPES[number]), right = ["circle", "square", "triangle"].indexOf(id); return <path className={`wire wire-${id}`} key={id} d={`M 48 ${30 + left * 50} C 135 ${30 + left * 50}, 185 ${30 + right * 50}, 272 ${30 + right * 50}`} />; })}</svg>
    <div className="wire-sockets">{SHAPES.map(id => <button className={`socket wire-${id} ${selected === id ? "selected" : ""} ${links.includes(id) ? "connected" : ""}`} key={id} aria-label={`Select ${id} wire`} aria-pressed={selected === id} disabled={links.includes(id)} draggable={!links.includes(id)} onDragStart={e => { select(id); e.dataTransfer.setData("text/plain", id); }} onClick={() => { select(id); miss(false); }}>{links.includes(id) ? "✓" : GLYPH[id]}</button>)}</div>
    <div className="wire-sockets">{(["circle", "square", "triangle"] as const).map(id => <button key={id} className={`socket wire-${id} ${links.includes(id) ? "connected" : ""}`} aria-label={`Connect ${id} socket`} disabled={links.includes(id)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); connect(id, e.dataTransfer.getData("text/plain")); }} onClick={() => connect(id)}>{links.includes(id) ? "✓" : GLYPH[id]}</button>)}</div>
  </div><p className="task-cue" role="status">{wrong ? "Same shape ↻" : links.length === 3 ? "Wires connected ✓" : "Tap a shape, then its matching socket."}</p><Tuning value={tuning} onChange={value => { tune(value); refresh(links, value); }} disabled={links.length !== 3} label="Radio signal" /></>;
}
function Tuning({ value, onChange, label, disabled = false }: { value: number; onChange(v: number): void; label: string; disabled?: boolean }) {
  return <div className={`tuning-unit ${!disabled && centered(value) ? "steady" : ""}`}><div className="signal-waves" aria-hidden="true"><svg viewBox="0 0 320 64"><path className="target-wave" d="M0 32 Q20 -5 40 32 T80 32 T120 32 T160 32 T200 32 T240 32 T280 32 T320 32" /><path style={{ transform: `translateX(${(value - 50) * .6}px)` }} d="M0 32 Q20 -5 40 32 T80 32 T120 32 T160 32 T200 32 T240 32 T280 32 T320 32" /></svg></div><label>{label}<span>{!disabled && centered(value) ? "✓ Steady" : "Aim for the center"}</span><span className="tuning-track"><i /><input type="range" min={0} max={100} value={value} disabled={disabled} aria-label={label} onChange={e => onChange(+e.target.value)} /></span></label><button type="button" className="gentle-step" disabled={disabled || centered(value)} onClick={() => onChange(value < 50 ? Math.min(50, value + 10) : Math.max(50, value - 10))}>Turn gently ↻</button></div>;
}
function Calibration({ onReady }: { onReady(i: TutorialInput | null): void }) {
  const [placed, place] = useState(false), [reading, read] = useState(10);
  return <><div className={`detector-scene ${placed ? "installed" : ""}`}><span className="detector-ground" /><GameArt name="sensor" size={110} /><button disabled={placed} onClick={() => place(true)}>{placed ? "Placed ✓" : "Plant detector ↓"}</button></div><Tuning value={reading} disabled={!placed} label="Detector calibration" onChange={value => { read(value); onReady(placed && centered(value) ? { kind: "calibrate", placed: true, reading: value } : null); }} /></>;
}
function IceCollection({ onReady }: { onReady(i: TutorialInput | null): void }) {
  const [pieces, setPieces] = useState<Record<string, number>>({});
  const ids = ["ice-a", "ice-b", "ice-c"];
  function drill(id: string) { const next = { ...pieces, [id]: Math.min(2, (pieces[id] ?? 0) + 1) }; setPieces(next); const gathered = ids.filter(k => next[k] === 2); onReady(gathered.length === 3 ? { kind: "collect", pieces: gathered } : null); }
  return <div className="ice-cave-game"><div className="ice-vein">{ids.map((id, index) => <button key={id} className={`ice-chunk stage-${pieces[id] ?? 0}`} disabled={pieces[id] === 2} onClick={() => drill(id)} aria-label={`Drill ice chunk ${index + 1}`}><span>◆</span><small>{pieces[id] === 2 ? "✓" : pieces[id] === 1 ? "Cracked" : "Drill"}</small></button>)}</div><div className="ice-bucket" role="status" aria-label={`${ids.filter(id => pieces[id] === 2).length} of 3 ice pieces collected`}>▱ {ids.map(id => <span className={pieces[id] === 2 ? "collected" : ""} key={id}>◆</span>)}</div></div>;
}
function MachineAssembly({ onReady }: { onReady(i: TutorialInput | null): void }) {
  const ids = ["gear", "filter", "tray"], glyphs = ["⚙", "▥", "▰"];
  const [parts, fit] = useState<string[]>([]), [selected, select] = useState<string | null>(null);
  function place(id: string, from = selected) { if (from !== id || parts.includes(id)) return; const next = [...parts, id]; fit(next); select(null); onReady(next.length === 3 ? { kind: "assemble", parts: next } : null); }
  return <div className="assembly-game"><div className={`food-machine ${parts.length === 3 ? "working" : ""}`}><span className="machine-light" />{ids.map((id, i) => <button key={id} className={`part-slot ${parts.includes(id) ? "filled" : ""}`} aria-label={`Fit ${id}`} onClick={() => place(id)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); place(id, e.dataTransfer.getData("text/plain")); }}>{glyphs[i]}</button>)}</div><div className="parts-tray">{ids.map((id, i) => <button key={id} draggable={!parts.includes(id)} disabled={parts.includes(id)} aria-label={`Select ${id}`} aria-pressed={selected === id} className={selected === id ? "selected" : ""} onDragStart={e => { select(id); e.dataTransfer.setData("text/plain", id); }} onClick={() => select(id)}>{glyphs[i]}<small>{id}</small></button>)}</div><p className="task-cue">Pick a part. Tap its matching space.</p></div>;
}
function IceMelter({ ice, onReady }: { ice: number; onReady(i: TutorialInput | null): void }) {
  const [loaded, load] = useState(false), [heat, warm] = useState(10);
  return <><div className={`melter ${loaded ? "loaded" : ""} ${centered(heat) && loaded ? "melting" : ""}`}><div className="melter-tank"><span className="melt-water" /><span className="melt-ice">◆ ◆ ◆</span></div><button disabled={loaded || ice !== 3} onClick={() => load(true)}>{loaded ? "Bucket loaded ✓" : "Load ice ↓"}</button></div><Tuning value={heat} label="Heater control" disabled={!loaded} onChange={value => { warm(value); onReady(loaded && centered(value) ? { kind: "convert", loaded, heat: value } : null); }} /></>;
}

export function ExercisePanel({ game, act, onClose }: { game: GameState; act(a: GameAction): void; onClose(): void }) {
  const [method, choose] = useState<"cardio" | "weights">("cardio"), [reps, rep] = useState(0), [steady, assist] = useState(true), [missed, miss] = useState(false);
  const start = useRef(0);
  if (game.tutorial.exercise !== "pending") return <div className="tutorial-success"><GameArt name={game.tutorial.fatigue ? "dark" : "check"} size={90} /><h3>{game.tutorial.fatigue ? "Rest today" : "Routine complete!"}</h3>{game.tutorial.fatigue && <p>Tomorrow starts at {DAY1_CONFIG.fatigueMorningEnergy} Energy.</p>}<button className="primary-button" onClick={onClose}>Night plan →</button></div>;
  const affordable = game.timeLeft >= DAY1_CONFIG.exerciseHours && game.resources.energy >= 5 && game.resources.water >= 2 && game.resources.science >= 1;
  function move() { const phase = ((performance.now() - start.current) % 1800) / 1800; if (method === "cardio" || steady || phase > .35 && phase < .65) { rep(n => Math.min(4, n + 1)); miss(false); } else miss(true); }
  return <section className="exercise-game"><div className="exercise-choices"><button aria-pressed={method === "cardio"} onClick={() => { choose("cardio"); rep(0); }}>Cardio</button><button aria-pressed={method === "weights"} onClick={() => { choose("weights"); rep(0); start.current = performance.now(); }}>Weights</button></div><div className={`exercise-actor ${reps > 0 ? "moving" : ""}`} key={reps}><GameArt name={method === "weights" ? "tools" : "sun"} size={100} /><div className="repetition-pips" aria-label={`${reps} of 4 repetitions`}>{[0, 1, 2, 3].map(i => <i key={i} className={i < reps ? "done" : ""} />)}</div></div>{method === "weights" && <><label className="steady-option"><input type="checkbox" checked={steady} onChange={e => { assist(e.target.checked); start.current = performance.now(); }} />Steady mode</label>{!steady && <div className="exercise-timing"><i /><b /></div>}</>}<button className="exercise-rep" onClick={move} disabled={reps >= 4}>{reps === 4 ? "Four done ✓" : method === "weights" ? "Lift ↑" : "Step →"}</button><p className="task-cue" role="status">{missed ? "Try the middle ↻" : method === "cardio" || steady ? "Any pace. Space works too." : "Lift when the marker reaches the center."}</p><ResourceEffects effects={DAY1_CONFIG.exerciseCost} hours={DAY1_CONFIG.exerciseHours} compact /><ResourceEffects effects={{ science: DAY1_CONFIG.exerciseReward }} compact /><button className="primary-button" disabled={reps !== 4 || !affordable} onClick={() => act({ type: "tutorial-exercise", method, repetitions: reps })}>Finish routine ✓</button><button className="skip-routine" onClick={() => act({ type: "tutorial-exercise", method: "skip", repetitions: 0 })}>Skip · start tomorrow with {DAY1_CONFIG.fatigueMorningEnergy} Energy</button></section>;
}
