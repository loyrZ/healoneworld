import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { FORMAT_LABELS, STATUS_LABELS, TIME_ZONE_LABELS, formatShortDate, formatTime } from "../../admin/classes/classData.mjs";
import "./Volunteer.css";
import "./VolunteerDashboard.css";
import VolunteerLayout from "./VolunteerLayout.jsx";

export default function VolunteerClassDetail({ classId }) {
    const { isLoaded, isSignedIn } = useAuth();
    const [load, setLoad] = useState({ status: "loading", item: null });

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) {
            window.location.assign("/login");
            return;
        }

        let cancelled = false;
        fetch(`/api/classes/instructor/${classId}`, { headers: { Accept: "application/json" } })
            .then(async (response) => {
                if (cancelled) return;
                if (response.status === 404) return setLoad({ status: "missing", item: null });
                if (!response.ok) throw new Error(String(response.status));
                setLoad({ status: "ready", item: await response.json() });
            })
            .catch((error) => {
                if (!cancelled) setLoad({ status: error.message === "403" ? "denied" : "error", item: null });
            });

        return () => {
            cancelled = true;
        };
    }, [classId, isLoaded, isSignedIn]);

    if (load.status === "loading") return <p className="vol-message" role="status">Loading class…</p>;

    return (
        <VolunteerLayout>
            <p className="class-edit__back"><a href="/volunteer">← Back to dashboard</a></p>
            {load.status === "missing" && <p className="vol-empty" role="alert">This class was not found or is not one of your submissions.</p>}
            {load.status === "denied" && <p className="vol-empty" role="alert">Instructor access is required to view this class.</p>}
            {load.status === "error" && <p className="vol-empty" role="alert">This class could not be loaded. Please try again.</p>}
            {load.status === "ready" && (
                <article className="vol-class-detail">
                    <div className="vol-class-detail__heading">
                        <h1>{load.item.title}</h1>
                        <span className={`vol-class-status vol-class-status--${load.item.status}`}>{STATUS_LABELS[load.item.status]}</span>
                    </div>
                    {load.item.status === "cancelled" && <p className="vol-notice" role="note">This class has been cancelled.</p>}
                    <p>{load.item.description || "No description provided."}</p>
                    <dl>
                        <div><dt>Date and time</dt><dd>{formatShortDate(load.item.date)} • {formatTime(load.item.startTime)}–{formatTime(load.item.endTime)}</dd></div>
                        <div><dt>Time zone</dt><dd>{TIME_ZONE_LABELS[load.item.timeZone] ?? load.item.timeZone}</dd></div>
                        <div><dt>Format</dt><dd>{FORMAT_LABELS[load.item.format] ?? load.item.format}</dd></div>
                        {load.item.location && <div><dt>Location</dt><dd>{load.item.location}</dd></div>}
                        {load.item.meetingLink && <div><dt>Meeting link</dt><dd><a href={load.item.meetingLink} target="_blank" rel="noreferrer">Open meeting link</a></dd></div>}
                        <div><dt>Capacity</dt><dd>{load.item.capacity ?? "Not set"}</dd></div>
                    </dl>
                </article>
            )}
        </VolunteerLayout>
    );
}