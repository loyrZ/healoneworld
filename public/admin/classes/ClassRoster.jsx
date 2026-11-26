/* HOW-108 / HOW-110 / HOW-279 / HOW-540: admin class details + attendee roster.
   Layout from the Figma "Mock Up Prototype" file, frame "Admin / Class Roster" (358:8475),
   mobile frame "Mobile / Admin / Class Roster" (358:13116). */

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import "../../css/layout.css";
import "../../css/theme.css";
import "../../css/components.css";
import AdminLayout from "../AdminLayout.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import SignInSheet from "./SignInSheet.jsx";
import { FORMAT_LABELS, STATUS_LABELS, formatShortDate, formatTime } from "./classData.mjs";
import "./ClassRoster.css";

// Shown at /admin/classes/:id/roster (see public/main.jsx).
// Data comes from GET /api/classes/admin/:id/roster (routes/classes.js).

const LOAD_ERRORS = {
    401: "Please sign in with an administrator account to view rosters.",
    403: "You don't have permission to view rosters.",
    404: "This class could not be found. It may have been removed.",
};

const ACTION_ERRORS = {
    401: "Your session has ended. Sign in again, then try once more.",
    403: "You don't have permission to change this class.",
    404: "This could not be found. Reload the page to see the latest roster.",
};

// Figma's "Show" dropdown. No waitlist option because waitlists are out of scope (HOW-108 #7).
const SHOW_OPTIONS = [
    { value: "active", label: "Registered" },
    { value: "all", label: "Everyone (incl. canceled and removed)" },
];

const ATTENDEE_STATUS_LABELS = {
    active: "Registered",
    canceled: "Canceled",
    removed: "Removed",
};

// HOW-149
function filterAttendees(attendees, search, show) {
    const term = search.trim().toLocaleLowerCase();

    return attendees.filter((person) =>
        (show === "all" || person.status === "active") &&
        (!term ||
            person.name.toLocaleLowerCase().includes(term) ||
            person.email.toLocaleLowerCase().includes(term))
    );
}

// Figma meta line: "Wednesday, October 14 · 10:00–11:30 AM PT · 3503 W Pico Blvd"
function longDate(date) {
    if (!date) return "";
    const [year, month, day] = date.split("-").map(Number);
    // Built at noon UTC so the weekday is the same in every time zone.
    return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
}

function rosterMeta(classRecord) {
    const time = classRecord.startTime
        ? `${formatTime(classRecord.startTime)}–${formatTime(classRecord.endTime)} PT`
        : "";

    return [
        longDate(classRecord.date) || formatShortDate(classRecord.date),
        time,
        classRecord.location || FORMAT_LABELS[classRecord.format],
    ].filter(Boolean).join(" · ");
}

// Reads the error message from an API response, falling back to a known one.
async function responseError(res, messages, fallback) {
    let body = {};
    try {
        body = await res.json();
    } catch {
        // Not JSON (for example a proxy error page); use the fallback message.
    }
    // Server errors (5xx) can carry raw database messages, so admins get the plain fallback.
    const serverMessage = res.status < 500 ? body.error : null;
    const error = new Error(messages[res.status] ?? serverMessage ?? fallback);
    error.status = res.status;
    error.body = body;
    return error;
}

// Figma "Stats" row. Only Registered and Canceled, since check-in and waitlist aren't in these stories.
function RosterStats({ classRecord, attendees }) {
    const count = classRecord.registrationCount;
    const registered = count === null || count === undefined ? "Unavailable" : `${count} / ${classRecord.capacity}`;
    const canceled = attendees.filter((person) => person.status !== "active").length;

    return (
        <dl className="admin-roster__stats">
            <div className="admin-roster__stat">
                <dt>Registered</dt>
                <dd>{registered}</dd>
            </div>
            <div className="admin-roster__stat">
                <dt>Canceled or removed</dt>
                <dd>{canceled}</dd>
            </div>
        </dl>
    );
}

// Figma table row. Leaving out the "Here", Phone, and Note columns, which aren't in these stories.
function AttendeeRow({ attendee, onRemove }) {
    return (
        <tr>
            <td data-label="Name">{attendee.name}</td>
            <td data-label="Email">{attendee.email}</td>
            <td data-label="Status">
                <span className={`admin-roster__badge admin-roster__badge--${attendee.status}`}>
                    {ATTENDEE_STATUS_LABELS[attendee.status] ?? attendee.status}
                </span>
            </td>
            <td className="admin-roster__row-actions">
                {/* HOW-566: Figma leaves this cell empty for registered rows, so Remove goes here */}
                {attendee.status === "active" && (
                    <button
                        type="button"
                        className="button button--outline admin-roster__small"
                        onClick={() => onRemove(attendee)}
                        aria-label={`Remove ${attendee.name}`}
                    >
                        Remove
                    </button>
                )}
            </td>
        </tr>
    );
}

function ClassRoster({ classId }) {
    const { isLoaded, isSignedIn } = useAuth();
    const [load, setLoad] = useState({ status: "loading", classRecord: null, attendees: [], error: null });
    const [attempt, setAttempt] = useState(0);
    const [search, setSearch] = useState("");
    const [show, setShow] = useState("active");
    const [confirm, setConfirm] = useState(null); // { kind: "cancel-class" } or { kind: "remove", attendee }
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [notice, setNotice] = useState(null);

    // HOW-147 / HOW-148: same loading pattern as ClassList.jsx, never mock data.
    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            setLoad({ status: "error", classRecord: null, attendees: [], error: { status: 401, message: LOAD_ERRORS[401] } });
            return;
        }

        let cancelled = false;
        setLoad((current) => ({ ...current, status: "loading", error: null }));

        fetch(`/api/classes/admin/${classId}/roster`, { headers: { Accept: "application/json" } })
            .then(async (res) => {
                if (!res.ok) throw await responseError(res, LOAD_ERRORS, "The roster could not be loaded.");
                return res.json();
            })
            .then((data) => {
                if (!cancelled) setLoad({ status: "ready", classRecord: data.class, attendees: data.attendees, error: null });
            })
            .catch((err) => {
                if (cancelled) return;
                setLoad({
                    status: "error",
                    classRecord: null,
                    attendees: [],
                    error: {
                        status: err.status,
                        message: err.status ? err.message : "Could not reach the server. Check your connection.",
                    },
                });
            });

        return () => {
            cancelled = true;
        };
    }, [isLoaded, isSignedIn, classId, attempt]);

    function openConfirm(next) {
        setActionError(null);
        setNotice(null);
        setConfirm(next);
    }

    function closeConfirm() {
        if (saving) return;
        setConfirm(null);
        setActionError(null);
    }

    async function postAction(url) {
        const res = await fetch(url, { method: "POST", headers: { Accept: "application/json" } });
        if (!res.ok) throw await responseError(res, ACTION_ERRORS, "Something went wrong. Nothing was changed.");
        return res.json();
    }

    // HOW-286: the class only shows as canceled after the server says it saved (HOW-279 #7).
    async function cancelClass() {
        setSaving(true);
        setActionError(null);

        try {
            const updated = await postAction(`/api/classes/admin/${classId}/cancel`);
            setLoad((current) => ({
                ...current,
                // Keep the roster's count; the class endpoint may not know it.
                classRecord: { ...current.classRecord, ...updated, registrationCount: current.classRecord.registrationCount },
            }));
            setConfirm(null);
            setNotice(`"${updated.title}" was canceled. Registrations are kept and new sign-ups are closed.`);
        } catch (err) {
            setActionError(err.status ? err.message : "Could not reach the server. The class was not canceled.");
        } finally {
            setSaving(false);
        }
    }

    function updateAttendee(registration, registrationCount) {
        setLoad((current) => ({
            ...current,
            attendees: current.attendees.map((person) =>
                person.id === registration.id ? { ...person, status: registration.status } : person
            ),
            classRecord: registrationCount === undefined
                ? current.classRecord
                : { ...current.classRecord, registrationCount },
        }));
    }

    // HOW-566 / HOW-568: only update the row and count from the server's answer (HOW-540 #6).
    async function removeAttendee(attendee) {
        setSaving(true);
        setActionError(null);

        try {
            const result = await postAction(`/api/classes/admin/${classId}/registrations/${attendee.id}/remove`);
            updateAttendee(result.registration, result.registrationCount);
            setConfirm(null);
            setNotice(`${attendee.name} was removed from this class.`);
        } catch (err) {
            if (err.status === 409 && err.body?.registration) {
                // Someone else already removed or canceled it: show the real status, no success message.
                updateAttendee(err.body.registration);
                setConfirm(null);
                setNotice(err.message);
            } else {
                setActionError(err.status ? err.message : "Could not reach the server. Nobody was removed.");
            }
        } finally {
            setSaving(false);
        }
    }

    const classRecord = load.classRecord;
    const isCanceled = classRecord?.status === "canceled";
    let content;

    if (load.status === "loading") {
        content = <p role="status" className="admin-roster__message">Loading roster…</p>;
    } else if (load.status === "error") {
        content = (
            <div role="alert" className="admin-roster__message admin-roster__message--error">
                <p>{load.error.message}</p>
                {load.error.status === 401 ? (
                    <a className="button" href="/sign-in">Sign in</a>
                ) : load.error.status !== 403 && load.error.status !== 404 && (
                    <button type="button" className="button" onClick={() => setAttempt((count) => count + 1)}>
                        Try again
                    </button>
                )}
            </div>
        );
    } else {
        const attendees = load.attendees;
        const visible = filterAttendees(attendees, search, show);

        content = (
            <>
                <RosterStats classRecord={classRecord} attendees={attendees} />

                {/* Figma "Toolbar": filters on the left, actions on the right */}
                <div className="admin-roster__toolbar">
                    <form className="admin-roster__filters" role="search" aria-label="Filter attendees" onSubmit={(event) => event.preventDefault()}>
                        <label className="admin-roster__field">
                            <span>Search</span>
                            <input type="search" placeholder="Name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
                        </label>
                        <label className="admin-roster__field">
                            <span>Show</span>
                            <select value={show} onChange={(event) => setShow(event.target.value)}>
                                {SHOW_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </label>
                    </form>

                    <div className="admin-roster__actions">
                        {/* HOW-155: the print stylesheet only shows SignInSheet */}
                        <button type="button" className="button button--outline" onClick={() => window.print()}>
                            Print sign-in sheet
                        </button>
                        {/* HOW-156: plain download link, the API checks admin access */}
                        <a className="button button--outline" href={`/api/classes/admin/${classId}/roster.csv`} download>
                            Export CSV
                        </a>
                        {/* HOW-286: not in the Figma frame, so it sits with the other actions */}
                        {!isCanceled && (
                            <button type="button" className="button admin-roster__danger" onClick={() => openConfirm({ kind: "cancel-class" })}>
                                Cancel class
                            </button>
                        )}
                    </div>
                </div>

                {visible.length === 0 ? (
                    <p className="admin-roster__message">
                        {attendees.length === 0 ? "No one has registered for this class yet." : "No attendees match your search."}
                    </p>
                ) : (
                    <div className="admin-roster__table-wrap">
                        <table className="admin-roster__table">
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">Email</th>
                                    <th scope="col">Status</th>
                                    <th scope="col"><span className="admin-roster__sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((attendee) => (
                                    <AttendeeRow
                                        key={attendee.id}
                                        attendee={attendee}
                                        onRemove={(person) => openConfirm({ kind: "remove", attendee: person })}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <SignInSheet classRecord={classRecord} attendees={attendees.filter((person) => person.status === "active")} />
            </>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-roster">
                <nav aria-label="Breadcrumb" className="admin-roster__breadcrumb">
                    <a href="/admin/classes">Classes &amp; Events</a> / Roster
                </nav>
                <h1>{classRecord?.title ?? "Class roster"}</h1>
                {classRecord && (
                    <p className="admin-roster__meta">
                        {rosterMeta(classRecord)}
                        {" · "}
                        {STATUS_LABELS[classRecord.status] ?? classRecord.status}
                    </p>
                )}

                {/* HOW-288: same wording idea as Figma's "Public / Class — Canceled" alert */}
                {isCanceled && (
                    <p className="admin-roster__alert">This class was canceled. New registrations are closed.</p>
                )}
                {notice && <p role="status" className="admin-classes__notice">{notice}</p>}

                {content}
            </div>

            {/* HOW-286 / HOW-566: Figma "Prototype / Cancel this registration?" dialog */}
            {confirm?.kind === "cancel-class" && (
                <ConfirmDialog
                    title="Cancel this class?"
                    message={`"${classRecord?.title}" (${rosterMeta(classRecord)}) will show as canceled and no one new can register. Current registrations are kept.`}
                    confirmLabel="Cancel class"
                    cancelLabel="Keep class"
                    busy={saving}
                    error={actionError}
                    onConfirm={cancelClass}
                    onClose={closeConfirm}
                />
            )}
            {confirm?.kind === "remove" && (
                <ConfirmDialog
                    title="Remove this attendee?"
                    message={`Remove ${confirm.attendee.name} from "${classRecord?.title}"? Their account isn't deleted.`}
                    confirmLabel="Remove attendee"
                    cancelLabel="Keep attendee"
                    busy={saving}
                    error={actionError}
                    onConfirm={() => removeAttendee(confirm.attendee)}
                    onClose={closeConfirm}
                />
            )}
        </AdminLayout>
    );
}

export default ClassRoster;
