/* HOW-155: printable sign-in sheet. Hidden on screen, shown by @media print in ClassRoster.css.
   Figma only has the "Print sign-in sheet" button, there's no frame for the sheet itself. */

import { formatShortDate, formatTime } from "./classData.mjs";

const BLANK_ROWS = 5; // room for walk-ins

// attendees are already filtered to active registrations by ClassRoster
function SignInSheet({ classRecord, attendees }) {
    const sorted = [...attendees].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <section className="sign-in-sheet">
            <h2>{classRecord.title}</h2>
            <p>
                {formatShortDate(classRecord.date)} · {formatTime(classRecord.startTime)}–{formatTime(classRecord.endTime)}
            </p>
            <table>
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Signature</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((attendee) => (
                        <tr key={attendee.id}>
                            <td>{attendee.name}</td>
                            <td></td>
                        </tr>
                    ))}
                    {Array.from({ length: BLANK_ROWS }, (_, index) => (
                        <tr key={`blank-${index}`}>
                            <td></td>
                            <td></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

export default SignInSheet;
