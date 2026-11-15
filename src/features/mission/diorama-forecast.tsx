import { applyEffects } from "@/game/engine";
import { RESOURCE_KEYS, type GameState, type Resource } from "@/game/types";
import type { TutorialTask } from "@/data/day-one";
import type { TutorialPlan } from "@/game/types";
import { workshopTerms } from "@/data/day-one-workshop";
import { WorkshopIcon, type WorkshopSymbol } from "@/components/workshop-art";

const NAMES: Record<Resource,string>={oxygen:"Air",water:"Water",power:"Power",energy:"Energy",shielding:"Shield",science:"Research points"};
const ICONS:Record<Resource,WorkshopSymbol>={oxygen:"bucket",water:"drop",power:"battery",energy:"readiness",shielding:"filter",science:"token"};
const number=(value:number)=>new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(value);
export function previewDiorama(game:GameState,task:TutorialTask,plan:TutorialPlan){
 const terms=workshopTerms(task,plan);
 try{
  const after=applyEffects(game,terms.cost,terms.hours,terms.reward);
  return {terms,after,reason:after.resources.power<=0?"Keep some Power for life support. Try Standard.":""};
 }catch{
  const missing=RESOURCE_KEYS.filter(key=>game.resources[key]+(terms.cost[key]??0)<0);
  return {terms,after:null,reason:game.timeLeft<terms.hours?"Not enough work time. Try Boost.":`Need more ${missing.map(key=>NAMES[key]).join(" and ")||"supplies"}. Try a supply stop.`};
 }
}
export function DioramaForecast({game,task,plan,ready,onFinish}: {game:GameState;task:TutorialTask;plan:TutorialPlan;ready:boolean;onFinish():void}){
 const {terms,after,reason}=previewDiorama(game,task,plan);
 const changed=RESOURCE_KEYS.filter(key=>(terms.cost[key]??0)!==0||key==="science"&&terms.reward>0);
 return <section className="diorama-forecast" aria-label="What finishing this mission changes"><div className="forecast-heading"><strong>{ready?"Ready to finish":"When you finish"}</strong><span><WorkshopIcon name="clock" size={17}/>{number(terms.hours)} work hours</span></div><div className="forecast-resources">{changed.map(key=>{
  const cost=Math.min(0,terms.cost[key]??0),gain=after?Math.max(0,after.resources[key]-game.resources[key]-cost):Math.max(0,terms.cost[key]??0)+(key==="science"?terms.reward:0);
  return <div className="forecast-resource" key={key}><WorkshopIcon name={ICONS[key]} size={23}/><div><span className="forecast-name">{NAMES[key]}</span><strong>{number(game.resources[key])}<span aria-hidden="true">→</span>{after?number(after.resources[key]):"—"}</strong><small>{cost<0&&<span className="loss">Use −{number(-cost)}</span>}{gain>0&&<span className="gain">Get +{number(gain)}</span>}</small></div></div>;
 })}</div><div className="forecast-commit"><span><WorkshopIcon name="book" size={22}/><span>Research progress <strong>+{terms.reward}</strong><small>Earned progress is never spent.</small></span></span>{ready?<button type="button" className="diorama-primary" disabled={!after||!!reason} onClick={onFinish}>Finish mission ✓</button>:<span className="forecast-practice">Practice is free. Finish the experiment above.</span>}</div>{reason&&<p className="forecast-reason" role="status">{reason}</p>}</section>;
}
