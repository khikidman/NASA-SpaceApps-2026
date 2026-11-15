import { WorkshopIcon } from "@/components/workshop-art";
import { WORKSHOP_LESSONS, type WorkshopLessonId } from "@/data/workshop-lessons";
import { getSource } from "@/data/sources";
import "./workshop-refinements.css";

/** Native disclosure: no popup, reading gate, reward, or automatic expansion. */
export function WorkshopFieldNote({ task }: { task: WorkshopLessonId }) {
  const note = WORKSHOP_LESSONS[task];
  return <details className="workshop-field-note">
    <summary><WorkshopIcon name="book" size={23} /><span><strong>Why this matters</strong><small>{note.title}</small></span><b aria-hidden="true">+</b></summary>
    <div className="field-note-content"><p>{note.takeaway}</p><p>{note.more}</p><p className="field-note-game"><small>In our game</small>{note.gameNote}</p><div className="field-note-sources">{note.sourceIds.map(id => { const source = getSource(id); return <a key={id} href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a>; })}</div></div>
  </details>;
}
export function WorkshopObservation({ task }: { task: WorkshopLessonId }) {
  return <p className="workshop-observation"><WorkshopIcon name="book" size={20} /><span>{WORKSHOP_LESSONS[task].takeaway}</span></p>;
}
