import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { FORMAT_LABELS, STATUS_LABELS, formatShortDate, formatTime } from "../../admin/classes/classData.mjs";
import "./Volunteer.css";
import "./VolunteerDashboard.css";
import VolunteerLayout from "./VolunteerLayout.jsx";

export default function VolunteerClassList({ period }) {
    const { isLoaded, isSignedIn } = useAuth();
    const [load, setLoad] = useState({ status: "loading", classes: [] });
    const title = period === "upcoming" ? "Upcoming classes" : "Previous classes";

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) {
            window.location.assign("/login");
            return;
        }

        let cancelled = false;
        fetch("/api/classes/instructor/dashboard", { headers: { Accept: "application/json" } })
            .then(async (response) => {
                if (cancelled) return;
                if (!response.ok) throw new Error(String(response.status));
                const data = await response.json();
                setLoad({ status: "ready", classes: data[period] });
            })
            .catch((error) => {
                if (!cancelled) setLoad({ status: error.message === "403" ? "denied" : "error", classes: [] });
            });

        return () => {
            cancelled = true;
        };
    }, [isLoaded, isSignedIn, period]);

    return (
        <VolunteerLayout>
            <p className="class-edit__back"><a href="/volunteer">← Back to dashboard</a></p>
            <h1>{title}</h1>
            <p className="vol-subtitle">Classes are grouped by their scheduled start time in the class time zone.</p>
            {load.status === "loading" && <p className="vol-empty" role="status">Loading classes…</p>}
            {load.status === "denied" && <p className="vol-empty" role="alert">Instructor access is required to view these classes.</p>}
            {load.status === "error" && <p className="vol-empty" role="alert">Classes could not be loaded. Please try again.</p>}
            {load.status === "ready" && load.classes.length === 0 && <p className="vol-empty">{period === "upcoming" ? "No upcoming hosted classes." : "No previous hosted classes."}</p>}
            {load.status === "ready" && load.classes.length > 0 && (
                <ul className="vol-class-list">
                    {load.classes.map((item) => (
                        <li key={item.id}>
                            <div>
                                <h2><a href={`/volunteer/classes/${item.id}`}>{item.title}</a></h2>
                                <p>{formatShortDate(item.date)}{item.startTime && ` • ${formatTime(item.startTime)}`} • {FORMAT_LABELS[item.format] ?? item.format}</p>
                                <p>{item.instructor}</p>
                            </div>
                            <span className={`vol-class-status vol-class-status--${item.status}`}>{STATUS_LABELS[item.status]}</span>
                        </li>
                    ))}
                </ul>
            )}
        </VolunteerLayout>
    );
}