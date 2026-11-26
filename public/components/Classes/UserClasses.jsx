import { useEffect, useState } from "react";
import { useAuth, useClerk } from "@clerk/react";
import "./UserClasses.css";

function formatClassDate(date) {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";

    return parsedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
}

function UserClasses() {
    const { isLoaded, isSignedIn } = useAuth();
    const { signOut } = useClerk();
    const [load, setLoad] = useState({ status: "loading", registrations: [], error: "" });
    const [cancellingId, setCancellingId] = useState(null);
    const [openingMeetingId, setOpeningMeetingId] = useState(null);

    async function loadRegistrations() {
        setLoad((current) => ({ ...current, status: "loading", error: "" }));
        try {
            const response = await fetch("/api/class-registrations/mine", { headers: { Accept: "application/json" } });
            const body = await response.json().catch(() => []);
            if (!response.ok) throw new Error(body.error || "Your registrations could not be loaded.");
            setLoad({ status: "ready", registrations: body, error: "" });
        } catch (error) {
            setLoad({ status: "error", registrations: [], error: error.message || "Your registrations could not be loaded." });
        }
    }

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            window.location.replace("/classes/sign-in");
        }
        if (isLoaded && isSignedIn) loadRegistrations();
    }, [isLoaded, isSignedIn]);

    async function cancelRegistration(registration) {
        if (!window.confirm(`Cancel your registration for ${registration.class.title}?`)) return;
        setCancellingId(registration.id);

        try {
            const response = await fetch(`/api/class-registrations/${registration.id}/cancel`, {
                method: "POST",
                headers: { Accept: "application/json" },
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || "Your cancellation could not be saved.");

            // Do not alter the UI until the server has persisted the cancellation.
            setLoad((current) => ({
                ...current,
                registrations: current.registrations.map((item) => item.id === registration.id
                    ? { ...item, status: "cancelled", cancelledAt: new Date().toISOString() }
                    : item),
            }));
        } catch (error) {
            setLoad((current) => ({ ...current, error: error.message || "Your cancellation could not be saved." }));
        } finally {
            setCancellingId(null);
        }
    }

    async function openMeeting(registration) {
        setOpeningMeetingId(registration.id);
        try {
            const response = await fetch(`/api/class-registrations/class/${registration.classId}/meeting`, {
                headers: { Accept: "application/json" },
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok || !body.meetingLink) {
                throw new Error(body.error || "The online meeting is unavailable.");
            }
            window.location.assign(body.meetingLink);
        } catch (error) {
            setLoad((current) => ({ ...current, error: error.message || "The online meeting is unavailable." }));
        } finally {
            setOpeningMeetingId(null);
        }
    }

    if (!isLoaded || !isSignedIn) return <p role="status">Loading your classes…</p>;

    return (
        <main className="user-classes">
            <header className="user-classes__header">
                <a className="user-classes__brand" href="/">
                    Heal One World
                </a>
                <button
                    type="button"
                    onClick={() =>
                        signOut({ redirectUrl: "/classes/sign-in" })
                    }
                >
                    Sign out
                </button>
            </header>

            <section aria-labelledby="classes-heading">
                <h1 id="classes-heading">My classes</h1>
                <p className="user-classes__intro">
                    View and manage your saved registrations.
                </p>

                {load.error && <p className="user-classes__error" role="alert">{load.error}</p>}
                {load.status === "loading" ? <p role="status">Loading registrations…</p> : load.registrations.length ? (
                    <div className="user-classes__list">
                        {load.registrations.map((registration) => {
                            const classItem = registration.class;
                            return (
                                <article
                                    className="user-classes__card"
                                    key={registration.id}
                                >
                                    <div>
                                        <h2>{classItem.title}</h2>
                                        <p>{formatClassDate(classItem.date)} · {classItem.startTime}–{classItem.endTime}</p>
                                        <p>{classItem.location || classItem.format}</p>
                                        <p className={`user-classes__status user-classes__status--${registration.status}`}>
                                            {registration.status === "cancelled" ? "Canceled" : "Registered"}
                                        </p>
                                    </div>
                                    {registration.status === "registered" && (
                                        <div className="user-classes__actions">
                                            {(["virtual", "hybrid"].includes(classItem.format)) && (
                                                <button type="button" disabled={openingMeetingId === registration.id} onClick={() => openMeeting(registration)}>
                                                    {openingMeetingId === registration.id ? "Opening…" : "Join online class"}
                                                </button>
                                            )}
                                            <button type="button" disabled={cancellingId === registration.id} onClick={() => cancelRegistration(registration)}>
                                                {cancellingId === registration.id ? "Canceling…" : "Cancel registration"}
                                            </button>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="user-classes__empty">
                        You do not have any class registrations.
                    </p>
                )}
            </section>
        </main>
    );
}

export default UserClasses;
