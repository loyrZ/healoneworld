import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import "../../css/theme.css";
import "./Volunteer.css";
import "./VolunteerDashboard.css";
import VolunteerLayout from "./VolunteerLayout.jsx";
import { STATUS_LABELS, formatShortDate, formatTime } from "../../admin/classes/classData.mjs";

// Check to see if signed in
export default function VolunteerDashboard() {
    const { isLoaded, isSignedIn } = useAuth();
    const [state, setState] = useState({status: "loading"});
    const [classes, setClasses] = useState({ status: "loading", data: null });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if(!isLoaded) return;
        // If not signed in, return to the login page
        if (!isSignedIn) {
            window.location.assign("/login");
            return;
        }
        // If signed in, go to the volunteer dashboard
        fetch("/api/volunteer/dashboard", {headers: { Accept: "application/json" }})
            .then(async(res) => {
                if (res.status===401) {
                    window.location.assign("/login");
                    return;
                }
                if (res.status === 403) return setState({status: "denied"});
                if (!res.ok) return setState({status: "error"});
                setState({status: "ok", data: await res.json()});
            })
            .catch((err) => {
                console.error("dashboard load failed:", err);
                setState({status: "error"});
            });
    }, [isLoaded, isSignedIn]);

    useEffect(() => {
        if (state.status !== "ok") return;

        let cancelled = false;

        fetch("/api/classes/instructor/dashboard", { headers: { Accept: "application/json" } })
            .then(async (res) => {
                if (cancelled) return;
                if (res.ok) {
                    setClasses({ status: "ready", data: await res.json() });
                } else if (res.status === 403) {
                    setClasses({ status: "unavailable", data: null });
                } else {
                    setClasses({ status: "error", data: null });
                }
            })
            .catch(() => {
                if (!cancelled) setClasses({ status: "error", data: null });
            });

        return () => {
            cancelled = true;
        };
    }, [state.status]);

    // don't leave page loading
    useEffect(() => {
        if (state.status !== "loading") return;
        const timer = setTimeout(() => setState({status: "error"}), 10000);
        return() => clearTimeout(timer);
    }, [state.status, attempt]);

    function retry() {
        setState({status: "loading"});
        setAttempt((n)=>n+1);
    }

    if (state.status === "loading") 
        return <p className="vol-message">Loading...</p>;
    if (state.status === "denied")
        return (
            <div className="vol-message" role="alert">
                <p className="vol-message" role="alert">
                    You don't have approved-volunteer access to this page.</p>
                <p><a href="/home.html">Back to the Heal One World website</a></p>
            </div>
        );
    if (state.status === "error")
        return (
            <div className="vol-message" role="alert">
                <p>Something went wrong. Please try again.</p>
                <button type="button" className="vol-button" onClick={retry}>Try again</button>
            </div>
        );

    return (
        <VolunteerLayout identity={state.data}>
        <h1>Volunteer dashboard</h1>
        <p className="vol-subtitle">
            Manage the classes you host and submit new classes for staff approval.
        </p>
        <p className="vol-notice" role="note">
            New class submissions are reviewed by staff before they appear on the public calendar.
        </p>

        <div className="vol-stats">
            {[
                ["Upcoming hosted", classes.data?.totals.upcoming],
                ["Pending approval", classes.data?.totals.pending],
                ["Classes hosted", classes.data?.totals.hosted],
            ].map(([label, value]) => (
                <div className="vol-stat" key={label}>
                    <p className="vol-stat-label">{label}</p>
                    <p className="vol-stat-value" aria-label={classes.status === "ready" ? `${value} ${label.toLowerCase()}` : "Not available yet"}>
                        {classes.status === "ready" ? value : "—"}
                    </p>
                </div>
            ))}
        </div>

        <section className="vol-section" aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading">Upcoming hosted classes</h2>
            {classes.status === "loading" && <p className="vol-empty" role="status">Loading hosted classes…</p>}
            {classes.status === "unavailable" && <p className="vol-empty">Instructor access is required to view hosted classes.</p>}
            {classes.status === "error" && <p className="vol-empty" role="alert">Hosted classes could not be loaded.</p>}
            {classes.status === "ready" && classes.data.upcoming.length === 0 && <p className="vol-empty">No upcoming hosted classes.</p>}
            {classes.status === "ready" && classes.data.upcoming.length > 0 && (
                <ul className="vol-submissions">
                    {classes.data.upcoming.slice(0, 5).map((item) => (
                        <li key={item.id}>
                            <span><a href={`/volunteer/classes/${item.id}`}>{item.title}</a><small>{formatShortDate(item.date)}{item.startTime && ` • ${formatTime(item.startTime)}`}</small></span>
                            <span className={`vol-class-status vol-class-status--${item.status}`}>{STATUS_LABELS[item.status]}</span>
                        </li>
                    ))}
                </ul>
            )}
            {classes.status === "ready" && classes.data.upcoming.length > 0 && <p className="vol-section-link"><a href="/volunteer/classes/upcoming">View all upcoming classes</a></p>}
        </section>

        <section className="vol-section" aria-labelledby="recent-heading">
            <h2 id="recent-heading">Pending submissions</h2>
            {classes.status === "loading" && <p className="vol-empty" role="status">Loading submissions…</p>}
            {classes.status === "unavailable" && <p className="vol-empty">Instructor access is required to view class submissions.</p>}
            {classes.status === "error" && <p className="vol-empty" role="alert">Submissions could not be loaded.</p>}
            {classes.status === "ready" && classes.data.pending.length === 0 && (
                <p className="vol-empty">No class submissions yet.</p>
            )}
            {classes.status === "ready" && classes.data.pending.length > 0 && (
                <ul className="vol-submissions">
                    {classes.data.pending.slice(0, 5).map((item) => (
                        <li key={item.id}>
                            <span><a href={`/volunteer/classes/${item.id}`}>{item.title}</a><small>{formatShortDate(item.date)}{item.startTime && ` • ${formatTime(item.startTime)}`}</small></span>
                            <span className="vol-class-status vol-class-status--pending">Pending approval</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>

        <div className="vol-dashboard__actions">
            <a className="vol-button" href="/volunteer/classes/new">Create a class</a>
            <a className="vol-link-button" href="/volunteer/classes/previous">View previous classes</a>
        </div>
    </VolunteerLayout>
    );
}   