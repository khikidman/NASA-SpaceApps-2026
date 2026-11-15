import { WORKSHOP_LESSONS, type WorkshopLessonId } from "@/data/workshop-lessons";
import { WorkshopIcon } from "@/components/workshop-art";
const HEADLINES:Record<WorkshopLessonId,string>={comms:"Messages can cross space.",detector:"The Moon shakes, too.",ice:"Some polar shadows hold water ice.",food:"Some space meals need added water.",melt:"Melting is only the first step.",exercise:"Move to stay strong."};
export function DioramaLearning({task}: {task:WorkshopLessonId}) {
 const note=WORKSHOP_LESSONS[task];
 return <header className="diorama-learning"><span><WorkshopIcon name="book" size={18}/>Your discovery</span><h3>{HEADLINES[task]}</h3><p>{note.takeaway}</p></header>;
}
