import { useEffect, useState } from "react";

export default function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [announcementId, setAnnouncementId] = useState(null);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [formMessage, setFormMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function loadAnnouncements() {
        try {
            const response = await fetch("/announcements/admin");

            if (!response.ok) {
                throw new Error("Unable to load announcements.");
            }

            const data = await response.json();
            setAnnouncements(data);
        } catch (err) {
            setError(err.message);
        }
    }

    useEffect(() => {
        loadAnnouncements();
    }, []);

    function clearForm() {
        setAnnouncementId(null);
        setTitle("");
        setMessage("");
        setFormMessage("");
        setError("");
    }

    function editAnnouncement(announcement) {
        setAnnouncementId(announcement.id_pk);
        setTitle(announcement.title);
        setMessage(announcement.message);
        setFormMessage("");
        setError("");
    }

    async function saveAnnouncement(action) {
        setFormMessage("");
        setError("");

        if (action === "publish" && (!title.trim() || !message.trim())) {
            setError("A title and message are required before publishing.");
            return;
        }

        setLoading(true);

        try {
            const method = announcementId ? "PUT" : "POST";
            const url = announcementId
                ? `/announcements/${announcementId}`
                : "/announcements";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title,
                    message,
                    action
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Unable to save announcement.");
            }

            setFormMessage(
                action === "publish"
                    ? "Announcement published successfully."
                    : "Announcement saved as a draft."
            );

            clearForm();
            await loadAnnouncements();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="admin-announcements">
            <h1>Manage Announcements</h1>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    saveAnnouncement("draft");
                }}
            >
                <label htmlFor="announcement-title">Title</label>
                <input
                    id="announcement-title"
                    type="text"
                    maxLength="255"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                />

                <label htmlFor="announcement-message">Message</label>
                <textarea
                    id="announcement-message"
                    rows="8"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                />

                <div className="announcement-actions">
                    <button type="submit" disabled={loading}>
                        Save as Draft
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => saveAnnouncement("publish")}
                    >
                        Publish Immediately
                    </button>

                    {announcementId && (
                        <button type="button" onClick={clearForm}>
                            Cancel Edit
                        </button>
                    )}
                </div>

                {formMessage && (
                    <p className="success-message">{formMessage}</p>
                )}

                {error && (
                    <p className="error-message">{error}</p>
                )}
            </form>

            <section className="existing-announcements">
                <h2>Existing Announcements</h2>

                {announcements.length === 0 ? (
                    <p>No announcements have been created.</p>
                ) : (
                    announcements.map((announcement) => (
                        <article
                            className="announcement-card"
                            key={announcement.id_pk}
                        >
                            <span className="announcement-status">
                                {announcement.status}
                            </span>

                            <h3>{announcement.title || "(Untitled draft)"}</h3>

                            <p>{announcement.message || "(No message yet)"}</p>

                            <button
                                type="button"
                                onClick={() => editAnnouncement(announcement)}
                            >
                                Edit
                            </button>
                        </article>
                    ))
                )}
            </section>
        </main>
    );
}