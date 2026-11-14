import Link from "next/link";
import { SOURCES } from "@/data/sources";

export default function AboutPage() {
  return <main className="about-shell">
    <Link href="/" className="back-link">← Back to your outpost</Link>
    <p className="eyebrow">BEHIND THE MISSION</p>
    <h1>Space science,<br /><span>made playable.</span></h1>
    <p className="intro-copy">This is an independent educational prototype for the NASA Space Apps project. It is not a NASA product or an operational mission simulator.</p>
    <section className="panel"><h2>What is real, and what is a game?</h2><p>The setting and learning cards introduce real space-science topics. All six training events are authored examples. No live NASA observations are currently imported, and no NASA images are used.</p><p>Oxygen, power, shield reserve, and science use invented points. Resource costs, storm impact, and emergency oxygen use are game rules, not physical measurements, radiation doses, or engineering predictions.</p><p>In this prototype, storms consume shield reserve first. Unabsorbed impact consumes emergency oxygen as an explicit game abstraction. Zero shielding increases vulnerability; only zero oxygen or power ends a mission.</p></section>
    <section className="panel"><h2>Explore the sources</h2><div className="sources-list">{SOURCES.map((source) => <article key={source.id}><h3><a href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a></h3><p>{source.description}</p></article>)}</div></section>
    <section className="panel"><h2>How future data will become an event</h2><p>A reviewed data update should retain the original source URL, observation date, and a description of the conversion into game rules. Historical scenarios should be labeled with their dates. A solar flare classification alone should not be presented as a measured astronaut radiation dose.</p><p>The local dataset stays available if a data service is offline. Mission turns run in your browser, and your progress is saved on this device when browser storage is available.</p></section>
  </main>;
}
