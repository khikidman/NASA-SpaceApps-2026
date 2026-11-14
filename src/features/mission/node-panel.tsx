"use client";
import { useState, type DragEvent } from "react";
import { GameArt } from "@/components/game-art";
import { ResourceEffects } from "@/components/resource-effects";
import { getTask } from "@/data/tasks";
import { getSource } from "@/data/sources";
import { canAfford, taskEffects } from "@/game/engine";
import type { GameAction, GameState, TaskStep } from "@/game/types";
import type { WorldEntity } from "@/world/types";
import { adjacent } from "@/world/exploration";
import { OPTION_VISUALS, STEP_PROMPTS } from "./visual-content";
export function NodePanel({ game, node, act, onToday, onClose }: { game: GameState; node: WorldEntity; act: (a: GameAction) => void; onToday(): void; onClose(): void }) {
  if (node.interaction.type === "base") return <section className="visual-complete"><GameArt name="home" size={120} /><h3>Home sweet home</h3><button className="primary-button" onClick={onToday}>Night plan →</button></section>;
  if (!adjacent(game.position, node.position)) return <p>Walk beside this stop first.</p>;
  if (node.interaction.type !== "task") return null;
  const task = getTask(game.missionId, node.interaction.taskId), progress = game.taskProgress[task.id] ?? 0, step = task.steps[progress];
  return <section className="visual-challenge"><div className="step-lights" role="img" aria-label={`${progress} of 2 steps complete`}>{task.steps.map((s, i) => <span key={s.id} className={i < progress ? "done" : i === progress ? "current" : ""}>{i < progress ? "✓" : i + 1}</span>)}</div>{step ? <StepPanel key={`${game.missionId}-${game.day}-${task.id}-${progress}`} game={game} nodeId={node.id} step={step} act={act} /> : <div className="visual-complete"><GameArt name="star" size={120} className="reward-star" /><h3>Mission complete!</h3><button className="primary-button" onClick={onClose}>Keep exploring →</button></div>}</section>;
}
function StepPanel({ game, nodeId, step, act }: { game: GameState; nodeId: string; step: TaskStep; act: (a: GameAction) => void }) {
  const [chosen, setAnswers] = useState<string[]>([]), [orderSlots, setOrderSlots] = useState<(string | null)[]>(() => step.options.map(() => null)), [hint, setHint] = useState(false), [dragOver, setDragOver] = useState(false);
  const answers = step.kind === "order" ? orderSlots.filter((id): id is string => id !== null) : chosen;
  const effects = taskEffects(step, answers), affordable = canAfford(game.resources, effects) && game.timeLeft >= step.hours;
  const bagSize = step.options.filter((o) => answers.includes(o.id)).reduce((n, o) => n + (o.weight ?? 0), 0);
  function select(id: string) {
    if (step.kind === "order") { setOrderSlots((slots) => { const next = [...slots], existing = next.indexOf(id), empty = next.indexOf(null); if (existing >= 0) next[existing] = null; else if (empty >= 0) next[empty] = id; return next; }); }
    else setAnswers((a) => step.kind === "pick" ? [id] : a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);
  }
  function drop(event: DragEvent, index?: number) {
    event.preventDefault(); setDragOver(false);
    const id = event.dataTransfer.getData("application/x-space-item");
    if (!step.options.some((o) => o.id === id)) return;
    if (step.kind === "order") setOrderSlots((slots) => { const next = [...slots], from = next.indexOf(id), to = index ?? next.indexOf(null); if (to < 0) return slots; const replaced = next[to]; if (from >= 0) next[from] = replaced; next[to] = id; return next; });
    else setAnswers((a) => a.includes(id) ? a : [...a, id]);
  }
  function artwork(id: string, size = 48) { return <GameArt name={OPTION_VISUALS[id]?.art ?? "notes"} size={size} />; }
  return <>
    <h3 className="visual-prompt">{STEP_PROMPTS[step.id] ?? step.prompt}</h3>
    {step.kind === "pack" && <div className={`packing-zone ${dragOver ? "drag-over" : ""} ${bagSize > (step.budget ?? 0) ? "over-budget" : ""}`} data-drop-zone="bag" onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => drop(e)} role="group" aria-label={`Bag spaces ${bagSize} of ${step.budget}`}>
      <div className="packing-heading"><GameArt name="bag" size={36} /><span>{bagSize} / {step.budget}</span><div className="packing-needs" aria-label="Items to pack">{step.answer.map((id) => <span key={id} className={answers.includes(id) ? "packed" : ""}>{artwork(id, 25)}{answers.includes(id) && <b>✓</b>}</span>)}</div><div className="bag-pips" aria-hidden="true">{Array.from({ length: step.budget ?? 5 }, (_, i) => <i key={i} className={i < bagSize ? "filled" : ""} />)}</div></div>
      <div className="bag-slots">{answers.map((id) => <button key={id} type="button" className="bag-token" style={{ gridColumn: `span ${step.options.find((o) => o.id === id)?.weight ?? 1}` }} onClick={() => select(id)} aria-label={`Remove ${OPTION_VISUALS[id]?.label}`}>{artwork(id, 38)}<span>×</span></button>)}{Array.from({ length: Math.max(0, (step.budget ?? 5) - bagSize) }, (_, i) => <span className="empty-slot" key={i}>+</span>)}</div>
    </div>}
    {step.kind === "order" && <div className="sequence-zone" role="group" aria-label="Your chosen order" data-drop-zone="sequence" onDragOver={(e) => e.preventDefault()} onDrop={(e) => drop(e)}>{orderSlots.map((id, i) => <button type="button" key={i} className={`sequence-slot ${id ? "has-item" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.stopPropagation(); drop(e, i); }} onClick={() => id && select(id)} aria-label={id ? `Step ${i + 1}: ${OPTION_VISUALS[id]?.label}, remove` : `Step ${i + 1}, empty`}><small>{i + 1}</small>{id ? <>{artwork(id, 48)}<span>{OPTION_VISUALS[id]?.label}</span></> : <span className="slot-plus">+</span>}</button>)}</div>}
    <div className={`picture-choices ${step.kind === "pack" ? "four-choices" : ""}`} role="group" aria-label="Challenge answers">{step.options.map((option) => { const visual = OPTION_VISUALS[option.id]; return <button type="button" className="picture-choice" key={option.id} draggable={step.kind !== "pick"} onDragStart={(e) => { e.dataTransfer.setData("application/x-space-item", option.id); e.dataTransfer.effectAllowed = "move"; }} aria-label={option.label} aria-pressed={answers.includes(option.id)} onClick={() => select(option.id)}>{artwork(option.id, step.kind === "pick" ? 88 : 64)}<strong>{visual?.label ?? option.label}</strong>{option.weight && <span className="weight-pips" aria-label={`${option.weight} bag spaces`}>{Array.from({ length: option.weight }, (_, i) => <i key={i} />)}</span>}{answers.includes(option.id) && <span className="choice-check">{step.kind === "order" ? orderSlots.indexOf(option.id) + 1 : "✓"}</span>}{option.effects && <ResourceEffects effects={option.effects} compact />}</button>; })}</div>
    <div className="visual-action-footer"><div className="visual-costs" aria-label="Step cost and reward"><ResourceEffects effects={step.cost} hours={step.hours} compact /><span aria-hidden="true">→</span><ResourceEffects effects={{ science: step.reward }} compact /></div>
      <button type="button" className="primary-button try-plan" aria-label="Check my plan" disabled={!(step.kind === "order" ? orderSlots.every(Boolean) : answers.length) || !affordable || game.status !== "playing"} onClick={() => act({ type: "submit", nodeId, answers })}><span>✓</span> Try it</button>
    </div>
    <div className="visual-extras"><button type="button" className="text-button" onClick={() => setHint((v) => !v)}>{hint ? "Hide hint" : "💡 Hint"}</button><details><summary>Discovery</summary><p>{step.fact}</p><a href={getSource(step.sourceId).url} target="_blank" rel="noreferrer">NASA ↗</a></details></div>{hint && <p className="hint-card" role="status">{step.hint}</p>}
  </>;
}
