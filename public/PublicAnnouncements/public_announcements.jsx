import { useEffect, useState } from "react";

import "../css/layout.css";
import "../css/theme.css";
import "../css/components.css";
import "../css/header.css";
import "./public-announcements.css";

export default function PublicAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadAnnouncements() {
            try {
                const response = await fetch("/announcements");

                if (!response.ok) {
                    throw new Error("Unable to load announcements.");
                }

                const data = await response.json();

                // The server should already return newest first. This keeps
                // the display correct if the response order changes later.
                const newestFirst = [...data].sort(
                    (a, b) =>
                        new Date(b.published_at) -
                        new Date(a.published_at)
                );

                setAnnouncements(newestFirst);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadAnnouncements();
    }, []);

    return (
        <main className="public-announcements-page" id="main-content" tabIndex={-1}>
            <section className="public-announcements-content">
                <p className="public-announcements-eyebrow">Stay connected</p>
                <h1>Announcements</h1>
                <p className="public-announcements-intro">
                    Stay up to date with the latest news, events, and opportunities
                    from Heal One World.
                </p>

                {loading && (
                    <p className="announcement-status">Loading announcements...</p>
                )}

                {!loading && error && (
                    <p className="announcement-status announcement-status--error">
                        {error}
                    </p>
                )}

                {!loading && !error && announcements.length === 0 && (
                    <p className="announcement-status">
                        There are currently no published announcements.
                    </p>
                )}

                {!loading && !error && announcements.length > 0 && (
                    <div className="public-announcement-list">
                        {announcements.map((announcement) => (
                            <article
                                className="public-announcement-card"
                                key={announcement.id_pk}
                            >
                                <div className="public-announcement-card__date">
                                    {formatPublishedDate(announcement.published_at)}
                                </div>

                                <div>
                                    <h2>{announcement.title}</h2>
                                    <p>{announcement.message}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

function formatPublishedDate(value) {
    if (!value) {
        return "";
    }

    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}
