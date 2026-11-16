import {useState} from "react";
import "../css/theme.css";
import "./ClassOfferings.css";
import {OFFERINGS, instructorsFor, instructorAnchor} from "./aboutData.js";

const SCHEDULE = "/calendar";

function OfferingImage({src, alt}) {
    const [failed, setFailed] = useState(false);
    if(!src || failed) return null;
    return <img className="offerings-image" src={src} alt={alt ?? ""} loading="lazy" onError={() => setFailed(true)}/>
}

export default function ClassOfferings() {
    return (
        <section className="offerings" aria-labelledby="offering-heading">
            <h2 id="offerings-heading">Class Offerings</h2>
            <p className="offerings-intro">
                This is a sample section of class offerings to be displayed to the user. Dates and times 
                for each class will be displayed on the Calendar.
            </p>
            <p className="pb-4"><a href={SCHEDULE}>View Calendar</a></p>

            {OFFERINGS.length === 0 ? (
                <p className="offerings-empty">Class offerings placeholder.</p>
            ) : (
                <ul className="offerings-grid">
                    {OFFERINGS.map((offering) => {
                        const teachers = instructorsFor(offering);
                        return (
                            <li key={offering.id} className="offerings-card">
                                <OfferingImage src={offering.image} alt={offering.imageAlt} />
                                <h3>{offering.name}</h3>
                                <p>{offering.description}</p>
                                <p className="offerings-meta">
                                    <strong>Instructors:</strong>{" "}
                                    {teachers.length === 0
                                        ? "TBA" : teachers.map((person, index) => (
                                            <span key={person.id}>
                                                {index > 0 && ", "}
                                                <a href={`#${instructorAnchor(person.id)}`}>{person.name}</a>
                                            </span>
                                        ))
                                    }
                                </p>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}