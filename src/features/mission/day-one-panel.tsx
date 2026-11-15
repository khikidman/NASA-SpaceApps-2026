"use client";
import { useEffect, useRef, useState } from "react";
import { GameArt } from "@/components/game-art";
import { ResourceEffects } from "@/components/resource-effects";
import { DAY1_CONFIG, DAY1_TASKS } from "@/data/day-one";
import { applyEffects } from "@/game/engine";
import { type GameAction, type GameState, type TutorialInput, type TutorialTaskId, type TutorialPlan } from "@/game/types";
import { RadioGame, DetectorGame, IceGame, KitchenGame, MelterGame } from "./diorama-games";
import { usePractice, clearPractice, useWorkshopMotion, integer, bool } from "./workshop-practice";
import astronautFrames from "@/assets/characters/astronaut-atlas.json";
import { ASTRONAUT_SHEET_SRC } from "@/assets/characters/astronaut-settings";
import { WorkshopIcon } from "@/components/workshop-art";
import { WorkshopFieldNote, WorkshopObservation } from "./workshop-notes";
import { DioramaLearning } from "./diorama-learning";
import { DioramaForecast } from "./diorama-forecast";
import { DIORAMA_STAGE_SRC } from "./diorama-scene";
import "./workshop-refinements.css";
import "./living-diorama.css";

export function DayOnePanel({ game, taskId, act, onClose }: { game: GameState; taskId: TutorialTaskId; act(a: GameAction): void; onClose(): void }) {
  const task = DAY1_TASKS.find(t => t.id === taskId)!;
  const [input, setInput] = useState<TutorialInput | null>(null);
  const [plan, choosePlan] = usePractice<TutorialPlan>(game.seed, taskId, "plan", "standard", (v): v is TutorialPlan => v === "standard" || v === "boost"), [hint, showHint] = useState(false);
  const [attempt, retry] = useState(0);
  const root = useRef<HTMLElement>(null); useWorkshopMotion(root);
  const complete = game.tutorial.completed.includes(taskId);
  useEffect(() => { if (complete) clearPractice(game.seed, taskId); }, [complete, game.seed, taskId]);
  const wins = { comms: ["Radio online!", "Next: set up your detector."], detector: ["Detector ready!", "Next: find three ice chunks."], ice: ["Ice packed!", "Bring your bucket home."], food: ["Kitchen working!", "Next: turn your ice into water."], melt: ["Water ready!", "Your base is ready for tonight."] };
  if (game.tutorial.completed.includes(taskId)) return <div className="tutorial-success workshop-win diorama-success"><DioramaLearning task={taskId}/><div className="workshop-reward-orbit" aria-hidden="true"><i>✦</i><i>✦</i><i>✦</i><GameArt name="check" size={90} /></div><h3>{wins[taskId][0]}</h3><p>{wins[taskId][1]}</p><button className="primary-button" onClick={onClose}>Keep exploring →</button><WorkshopFieldNote task={taskId} /></div>;
  return <section className="day1-workshop living-diorama" ref={root} data-hint={hint}>
    <DioramaLearning task={taskId} />
    <div className="diorama-tools"><span>Mission {DAY1_TASKS.findIndex(t => t.id === taskId) + 1} / 5</span><div><button type="button" aria-label="Reset only this practice task" onClick={() => { clearPractice(game.seed, taskId); choosePlan("standard"); setInput(null); retry(n => n + 1); }}><WorkshopIcon name="reset" size={16}/>Reset</button><button type="button" aria-expanded={hint} onClick={() => showHint(!hint)}><WorkshopIcon name="hint" size={17}/>{hint ? "Hide hint" : "Hint"}</button></div></div>
    {hint && <p className="diorama-help" role="status">{{ comms: "Match relay shapes, then line up both dish pointers. You can use the fine-tuning controls below.", detector: "Choose flat ground. Tap the feet until each metal post reaches its dashed height.", ice: "Inspect deposits. Turn each drill onto its bright seam, then pack the core.", food: "Fit the parts, turn the valves onto their outlines, and watch where the test flow stops.", melt: "Warm each batch to its game target. Connect treatment, open the valve, then check a sample." }[taskId]}</p>}
    {taskId === "comms" && <RadioGame key={attempt} seed={game.seed} onReady={setInput} />}
    {taskId === "detector" && <DetectorGame key={attempt} seed={game.seed} onReady={setInput} />}
    {taskId === "ice" && <IceGame key={attempt} seed={game.seed} onReady={setInput} />}
    {taskId === "food" && <KitchenGame key={attempt} seed={game.seed} onReady={setInput} />}
    {taskId === "melt" && <MelterGame key={attempt} seed={game.seed} ice={game.tutorial.ice} onReady={setInput} />}
    {input && <fieldset className="diorama-plans"><legend>Work mode</legend>{(["standard", "boost"] as const).map(mode => <label key={mode}><input type="radio" name={`work-plan-${taskId}`} checked={plan === mode} onChange={() => choosePlan(mode)} /><span>{mode === "standard" ? "Standard · save Power" : "Boost · spend Power to save Energy + time"}</span></label>)}</fieldset>}
    <DioramaForecast game={game} task={task} plan={plan} ready={!!input} onFinish={() => input && act({type:"tutorial-submit",taskId,input:{...input,plan}})} />
    <div className="diorama-science-notes"><WorkshopFieldNote task={taskId} /><span>Practice stays in this tab.</span></div>
  </section>;
}

function ExerciseAvatar({ reps, method }: { reps: number; method: "cardio" | "weights" }) {
  const frame = astronautFrames.frames[method === "cardio" && reps ? reps % 2 ? 2 : 5 : 0], scale = 105 / frame.referenceHeight;
  return <div className={`routine-scene ${method}`} style={{backgroundImage:`url("${DIORAMA_STAGE_SRC}")`}}><div className="routine-floor" /><svg key={reps} className={reps ? "routine-astronaut rep-motion" : "routine-astronaut"} viewBox="-65 -125 130 145" role="img" aria-label={method === "cardio" ? "Your astronaut on the exercise mat" : "Your astronaut at the exercise station"}><svg x={-frame.anchorX * scale} y={-frame.anchorY * scale} width={frame.width * scale} height={frame.height * scale} viewBox={`${frame.x} ${frame.y} ${frame.width} ${frame.height}`} overflow="hidden"><image href={ASTRONAUT_SHEET_SRC} width={astronautFrames.width} height={astronautFrames.height} /></svg></svg>{method === "weights" && <svg className={reps ? "routine-weight rep-motion" : "routine-weight"} key={`weight-${reps}`} viewBox="0 0 90 70" aria-hidden="true"><path d="M15 42 H75" stroke="#c8c8ba" strokeWidth="7"/><rect x="10" y="24" width="13" height="36" rx="4" fill="#535c6b"/><rect x="67" y="24" width="13" height="36" rx="4" fill="#535c6b"/><path d="M15 25 V59 M75 25 V59" stroke="#d9ac57" strokeWidth="3"/></svg>}</div>;
}
export function ExercisePanel({ game, act, onClose }: { game: GameState; act(a: GameAction): void; onClose(): void }) {
  const [method, choose] = usePractice<"cardio" | "weights">(game.seed, "exercise", "method", "cardio", (v): v is "cardio" | "weights" => v === "cardio" || v === "weights");
  const [reps, rep] = usePractice(game.seed, "exercise", "reps", 0, integer(0, 4)), [guided, guide] = usePractice(game.seed, "exercise", "guided", true, bool);
  const [auto, autoTo] = useState(false), [cue, say] = useState("Four gentle moves. Go at your pace.");
  const marker = useRef<HTMLElement>(null), root = useRef<HTMLElement>(null); useWorkshopMotion(root);
  const done = game.tutorial.exercise !== "pending";
  useEffect(() => { if (done) clearPractice(game.seed, "exercise"); }, [done, game.seed]);
  useEffect(() => {
    if (!auto || reps >= 4) return;
    const timer = setInterval(() => { if (!document.hidden) rep(n => Math.min(4, n + 1)); }, 950);
    return () => clearInterval(timer);
  }, [auto, reps, rep]);
  if (done) return <div className="tutorial-success workshop-win"><GameArt name={game.tutorial.fatigue ? "dark" : "check"} size={90} /><h3>{game.tutorial.fatigue ? "Rest today" : "Routine complete!"}</h3><p>{game.tutorial.fatigue ? `Tomorrow starts at ${DAY1_CONFIG.fatigueMorningEnergy} Energy.` : "Four moves done. Ready for tomorrow."}</p><button className="primary-button" onClick={onClose}>Night plan →</button></div>;
  let affordable = true;
  try { applyEffects(game, DAY1_CONFIG.exerciseCost, DAY1_CONFIG.exerciseHours, DAY1_CONFIG.exerciseReward); } catch { affordable = false; }
  function move(foot?: number) {
    if (auto || reps >= 4) return;
    if (!guided && method === "cardio" && foot !== reps % 2) { say("Try the glowing foot. No rush."); return; }
    if (!guided && method === "weights" && marker.current?.parentElement) {
      const m = marker.current.getBoundingClientRect(), track = marker.current.parentElement.getBoundingClientRect();
      const at = (m.left + m.width / 2 - track.left) / track.width;
      if (at < .32 || at > .68) { say("Aim for the center, or switch on Guided mode."); return; }
    }
    rep(n => Math.min(4, n + 1)); say(reps === 3 ? "Four done!" : "Nice and steady ✓");
  }
  return <section className="day1-workshop workshop-routine living-diorama" ref={root}><DioramaLearning task="exercise"/>
    <div className="exercise-choices">{(["cardio", "weights"] as const).map(mode => <button key={mode} type="button" aria-pressed={method === mode} onClick={() => { choose(mode); rep(0); autoTo(false); say(mode === "cardio" ? "Alternate feet. Any pace." : "Lift gently. Try the center band."); }}><WorkshopIcon name={mode === "cardio" ? "foot" : "lift"} size={21} />{mode === "cardio" ? "Space steps" : "Gentle lifts"}</button>)}</div>
    <ExerciseAvatar reps={reps} method={method} />
    <div className="routine-progress" role="progressbar" aria-label="Exercise repetitions" aria-valuemin={0} aria-valuemax={4} aria-valuenow={reps}>{[0, 1, 2, 3].map(i => <span key={i} className={i < reps ? "done" : ""}>{i < reps ? "✓" : i + 1}</span>)}</div>
    <label className="steady-option"><input type="checkbox" checked={guided} onChange={e => { guide(e.target.checked); autoTo(false); }} />Guided mode · no timing needed</label>
    {!guided && method === "weights" && <div className="routine-timing" aria-label="Lift when the marker is in the outlined center band"><i /><b ref={marker} /></div>}
    {!guided && method === "cardio" ? <div className="routine-feet">{[0, 1].map(foot => <button key={foot} type="button" disabled={reps >= 4 || auto} aria-label={`Step with ${foot === 0 ? "left" : "right"} foot`} className={reps % 2 === foot && reps < 4 ? "next-foot" : ""} onClick={() => move(foot)}><WorkshopIcon name="foot" size={32} className={foot === 1 ? "right-foot" : ""} /><small>{foot === 0 ? "Left" : "Right"}</small></button>)}</div> : <button className="exercise-rep" type="button" onClick={() => move()} disabled={reps >= 4 || auto}>{reps >= 4 ? "Four done ✓" : method === "weights" ? "Lift ↑" : "Step →"}</button>}
    {guided && reps < 4 && <button type="button" className="routine-guide" onClick={() => autoTo(!auto)}><WorkshopIcon name={auto ? "pause" : "play"} size={18} />{auto ? "Pause guide" : "Follow the guide"}</button>}
    <p className="workshop-cue" role="status">{cue}</p>
    {reps === 4 && <WorkshopObservation task="exercise" />}
    <WorkshopFieldNote task="exercise" />
    <div className="workshop-commit"><ResourceEffects effects={DAY1_CONFIG.exerciseCost} hours={DAY1_CONFIG.exerciseHours} compact /><ResourceEffects effects={{ science: DAY1_CONFIG.exerciseReward }} compact /><button className="primary-button" disabled={reps !== 4 || !affordable} onClick={() => act({ type: "tutorial-exercise", method, repetitions: reps })}>Finish routine ✓</button></div>
    {!affordable && <p className="workshop-cue">Save your supplies: you can choose rest instead.</p>}
    <button type="button" className="skip-routine" onClick={() => { autoTo(false); act({ type: "tutorial-exercise", method: "skip", repetitions: 0 }); }}>Choose rest · tomorrow starts at {DAY1_CONFIG.fatigueMorningEnergy} Energy</button>
  </section>;
}
