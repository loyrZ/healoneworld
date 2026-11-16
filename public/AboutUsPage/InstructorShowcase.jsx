import {useState} from "react";
import "../css/theme.css";
import "./InstructorShowcase.css";
import {INSTRUCTORS, SAMPLE_NOTICE, offeringsFor, instructorAnchor} from "./aboutData.js";

function initials(name) {
    return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function Avatar({person}) {
    const [failed, setFailed] = useState(false);
    if (person.photo && !failed) {
        return (
            <img className="showcase-avatar" src={person.photo} loading="lazy"
                alt={person.photoAlt || `Photo of ${person.name}`}
                onError={() => setFailed(true)}
            />
        );
    }
    return <div className="showcase-avatar showcase-avatar--placeholder" aria-hidden="true">{initials(person.name)}</div>
}

export default function InstructorShowcase(){
    const hasSample = INSTRUCTORS.some((person) => person.isSample);
    return (
        <section className="showcase" aria-labelledby="instructors-heading">
            <h2 id="instructors-heading">Our instructors</h2>
            {hasSample && <p className="showcase-sample-note" role="note">{SAMPLE_NOTICE}</p>}

            {INSTRUCTORS.length === 0 ? (
                <p className="showcase-empty">Instructor profiles.</p>
            ) : (
                <ul className="showcase-grid">
                    {INSTRUCTORS.map((person) => {
                        const taught = offeringsFor(person);
                        return (
                            <li key={person.id} id={instructorAnchor(person.id)} className="showcase-card">
                                <Avatar person={person} />
                                <h3>
                                    {person.name}
                                    {person.isSample && <span className="showcase-badge">Sample</span>}
                                </h3>
                                <p>{person.bio}</p>
                                <p className="showcase-meta">
                                    <strong>Teaches:</strong>
                                    {taught.length ? taught.map((o) => o.name).join(", ") : "TBA"}
                                </p>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    );
}