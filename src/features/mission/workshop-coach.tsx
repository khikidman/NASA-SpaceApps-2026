import type { ReactNode } from "react";
import type { TutorialTaskId } from "@/game/types";
import { EquipmentArtwork, WorkshopIcon } from "@/components/workshop-art";

/** A single current verb; fuller explanations stay behind optional controls. */
export function ActionGuide({ task, title, detail, count, total, children }: { task: TutorialTaskId; title: string; detail: string; count: number; total: number; children?: ReactNode }) {
  return <div className={`workshop-objective ${count >= total ? "achieved" : ""}`}>
    <span className="objective-device" aria-hidden="true"><EquipmentArtwork task={task} size={62} />{count >= total && <span className="device-ready"><WorkshopIcon name="check" size={19} /></span>}</span>
    <div><strong>{title}</strong><small>{count >= total ? "Check complete. Continue when you’re ready." : detail}</small></div>
    <span className="objective-count" aria-label={`${count} of ${total} complete`}>{count}/{total}</span>
    {children}
  </div>;
}
