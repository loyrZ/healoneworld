import {OFFERINGS, INSTRUCTORS, SAMPLE_NOTICE} from "./aboutMockData.js";
export {OFFERINGS, INSTRUCTORS, SAMPLE_NOTICE};
export const instructorAnchor = (id) => `instructor-${id}`;

export function instructorsFor(offering) {
    return (offering.instructorIds ?? [])
    .map((id) => INSTRUCTORS.find((person) => person.id === id))
    .filter(Boolean);
}

export function offeringsFor(person) {
    return OFFERINGS.filter((offering) => (offering.instructorIds ?? []).includes(person.id));
}

const PRIVATE_KEYS = ["email", "phone", "password", "token", "address"];

export function findDataProblems() {
    const problems = []; 
    const check = (label, records) => {
        const seen = new Set();
        records.forEach((record) => {
            if (!record.id) problems.push(`${label}: no record for id`);
            else if (seen.has(record.id)) problems.push(`${label}: duplicate id "${record.id}"`);
            seen.add(record.id);
            PRIVATE_KEYS.forEach((key) => {
                if (key in record) problems.push(`${label} "${record.id}": remove private field "${key}"`);
            });
        });
    };
    check("offering", OFFERINGS);
    check("instructor", INSTRUCTORS);
    
    const known = new Set(INSTRUCTORS.map((person) => person.id));
    OFFERINGS.forEach((offering) => {
        (offering.instructorIds ?? []).forEach((id) => {
            if(!known.has(id)) problems.push(`offering "${offering.id}": unknown instructor id "${id}"`);
        });
    });
    return problems;
}

if (import.meta.env?.DEV) {
    const problems = findDataProblems();
    if (problems.length) console.warn("About Us data problems:", problems);
}
