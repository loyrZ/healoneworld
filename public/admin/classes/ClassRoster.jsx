import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import "../../css/layout.css";
import "../../css/theme.css";
import "../../css/components.css";
import AdminLayout from "../AdminLayout.jsx";
import { FORMAT_LABELS, formatShortDate, formatTime } from "./classData.mjs";
import "./ClassRoster.css";

const LOAD_ERRORS = {
    401: "Please sign in with an administrator account to view this class.",
    403: "You don't have permission to view this class.",
    404: "This class could not be found. It may have been removed.",
};

function statusLabel(status) {
    return status === "cancelled" ? "Canceled" : "Registered";
}

function ClassRoster({ classId }) {
    const { isLoaded, isSignedIn } = useAuth();
    const [load, setLoad] = useState({ status: "loading", record: null, roster: [], error: null });
    const [attempt, setAttempt] = useState(0);
    const [query, setQuery] = useState("");
    const [showAccessibility, setShowAccessibility] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) {
            setLoad({ status: "error", record: null, roster: [], error: { status: 401, message: LOAD_ERRORS[401] } });
            return;
        }

        let cancelled = false;
        setLoad((current) => ({ ...current, status: "loading", error: null }));
        Promise.all([
            fetch(`/api/classes/admin/${classId}`, { headers: { Accept: "application/json" } }),
            fetch(`/api/class-registrations/admin/class/${classId}`, { headers: { Accept: "application/json" } }),
        ])
            .then(async ([classResponse, rosterResponse]) => {
                const failed = [classResponse, rosterResponse].find((response) => !response.ok);
                if (failed) {
                    const error = new Error(LOAD_ERRORS[failed.status] ?? "This class could not be loaded.");
                    error.status = failed.status;
                    throw error;
                }
                return Promise.all([classResponse.json(), rosterResponse.json()]);
            })
            .then(([record, roster]) => {
                if (!cancelled) setLoad({ status: "ready", record, roster, error: null });
            })
            .catch((error) => {
                if (!cancelled) {
                    setLoad({
                        status: "error",
                        record: null,
                        roster: [],
                        error: { status: error.status, message: error.status ? error.message : "Could not reach the server. Check your connection." },
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [attempt, classId, isLoaded, isSignedIn]);

    if (load.status === "loading") {
        return <AdminLayout><h1>Class details</h1><p role="status">Loading class…</p></AdminLayout>;
    }

    if (load.status === "error") {
        return (
            <AdminLayout>
                <h1>Class details</h1>
                <div className="class-roster__alert" role="alert">
                    <p>{load.error.message}</p>
                    {load.error.status === 401 && <a href="/sign-in">Sign in</a>}
                    {![401, 403, 404].includes(load.error.status) && <button type="button" onClick={() => setAttempt((count) => count + 1)}>Try again</button>}
                    <a href="/admin/classes">Back to classes</a>
                </div>
            </AdminLayout>
        );
    }

    const { record, roster } = load;
    const activeCount = roster.filter((registration) => registration.status === "registered").length;
    const cancelledCount = roster.filter((registration) => registration.status === "cancelled").length;
    const remainingSeats = record.capacity === null ? null : Math.max(0, record.capacity - activeCount);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const displayedRoster = roster.filter((registration) =>
        !normalizedQuery || registration.name.toLocaleLowerCase().includes(normalizedQuery) || registration.email.toLocaleLowerCase().includes(normalizedQuery)
    );

    return (
        <AdminLayout>
            <p className="class-roster__back"><a href="/admin/classes">← Back to classes</a></p>
            <p className="class-roster__breadcrumb">Classes &amp; Events / Roster</p>
            <h1>{record.title}</h1>
            <p className="class-roster__meta">
                {formatShortDate(record.date)} · {formatTime(record.startTime)}–{formatTime(record.endTime)} · {record.location || FORMAT_LABELS[record.format] || record.format}
            </p>

            <section className="class-roster__stats" aria-label="Registration summary">
                <article><strong>{record.capacity === null ? `${activeCount}` : `${activeCount} / ${record.capacity}`}</strong><span>Registered</span></article>
                <article><strong>{remainingSeats === null ? "—" : remainingSeats}</strong><span>Seats remaining</span></article>
                <article><strong>{cancelledCount}</strong><span>Canceled</span></article>
            </section>

            <div className="class-roster__filters">
                <label htmlFor="roster-search">Search</label>
                <input id="roster-search" type="search" placeholder="Name or email" value={query} onChange={(event) => setQuery(event.target.value)} />
                <label className="class-roster__accessibility"><input type="checkbox" checked={showAccessibility} onChange={(event) => setShowAccessibility(event.target.checked)} /> Show accessibility notes</label>
            </div>

            <div className="class-roster__table-wrap">
                <table className="class-roster__table">
                    <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Phone</th>{showAccessibility && <th scope="col">Accessibility notes</th>}<th scope="col">Status</th></tr></thead>
                    <tbody>
                        {displayedRoster.length ? displayedRoster.map((registration) => (
                            <tr key={registration.id}>
                                <td>{registration.name}</td><td>{registration.email}</td><td>{registration.phone || "—"}</td>
                                {showAccessibility && <td>{registration.accessibilityNotes || "—"}</td>}
                                <td><span className={`class-roster__status class-roster__status--${registration.status}`}>{statusLabel(registration.status)}</span></td>
                            </tr>
                        )) : <tr><td colSpan={showAccessibility ? 5 : 4}>No registrations match your search.</td></tr>}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

export default ClassRoster;