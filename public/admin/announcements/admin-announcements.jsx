import { useEffect, useState } from "react";
import "../../css/layout.css";
import "../../css/theme.css";
import "../../css/components.css";
import "../../css/header.css";
import "./announcements.css";

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
        <main className="admin-announcements-page">
    <div className="admin-announcements-shell">
        <aside className="admin-sidebar">
        <p className="admin-sidebar__brand">
            HEAL ONE WORLD
        </p>

        <nav aria-label="Administrator navigation">
            <ul className="admin-sidebar__links">
                <li>
                    <a href="/admin/dashboard">
                        Dashboard
                    </a>
                </li>

                <li>
                    <a href="/admin/classes">
                        Classes &amp; Events
                    </a>
                </li>

                <li>
                    <a
                        href="/admin/announcements"
                        aria-current="page"
                    >
                        Announcements
                    </a>
                </li>

                <li>
                    <a href="/admin/volunteers">
                        Volunteers
                    </a>
                </li>

                <li>
                    <a href="/admin/donations">
                        Donations
                    </a>
                </li>

                <li>
                    <a href="/admin/users">
                        Users / Staff
                    </a>
                </li>

                <li>
                    <a href="/admin/settings">
                        Settings
                    </a>
                </li>
            </ul>
        </nav>

        <div className="admin-sidebar__logout">
            <button type="button" className="button">
                Log out
            </button>
        </div>
    </aside>

        <section className="admin-announcements-content">
            
    <header>
        <h1>Announcements</h1>
        <p>
            Publish updates and important information to the website.
        </p>

        {!announcementId && (
            <button
                type="button"
                className="button"
                onClick={clearForm}
            >
                New announcement
            </button>
        )}
    </header>

    <form
        className="announcement-form"
        onSubmit={(event) => {
            event.preventDefault();
            saveAnnouncement("draft");
        }}
    >
        <div className="announcement-form__field">
            <label htmlFor="announcement-title">Title</label>
            <input
                id="announcement-title"
                type="text"
                maxLength="255"
                placeholder="Announcement title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
            />
        </div>

        <div className="announcement-form__field">
            <label htmlFor="announcement-message">Message</label>
            <textarea
                id="announcement-message"
                rows="8"
                placeholder="Write the announcement message..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
            />
        </div>

        <fieldset className="announcement-form__visibility">
            <legend className="announcement-form__legend">
                Visibility
            </legend>

            <div className="announcement-form__options">
                <label className="announcement-form__option">
                    <input
                        type="radio"
                        name="publish-action"
                        checked={!announcementId}
                        readOnly
                    />
                    Publish now
                </label>

                <label className="announcement-form__option">
                    <input
                        type="radio"
                        name="publish-action"
                        checked={Boolean(announcementId)}
                        readOnly
                    />
                    Save as draft
                </label>
            </div>
        </fieldset>

        <div className="announcement-form__actions">
            <button
                type="button"
                className="button button--primary"
                disabled={loading}
                onClick={() => saveAnnouncement("publish")}
            >
                Publish announcement
            </button>

            <button
                type="submit"
                className="button button--secondary"
                disabled={loading}
            >
                Save draft
            </button>

            {announcementId && (
                <button
                    type="button"
                    className="button button--outline"
                    onClick={clearForm}
                >
                    Cancel edit
                </button>
            )}
        </div>

        {formMessage && (
            <p className="announcement-form__message announcement-form__message--success">
                {formMessage}
            </p>
        )}

        {error && (
            <p className="announcement-form__message announcement-form__message--error">
                {error}
            </p>
        )}
    </form>

    <section className="existing-announcements">
        <h2>Existing Announcements</h2>

        {announcements.length === 0 ? (
            <p className="announcement-status">
                No announcements have been created.
            </p>
        ) : (
            <div className="announcement-list">
                {announcements.map((announcement) => (
                    <article
                        className="announcement-row"
                        key={announcement.id_pk}
                    >
                        <span className="announcement-row__title">
                            {announcement.title || "(Untitled draft)"}
                        </span>

                        <span className="announcement-row__status">
                            {announcement.status}
                        </span>

                        <span className="announcement-row__date">
                            {announcement.published_at ||
                                announcement.updated_at}
                        </span>

                        <button
                            type="button"
                            className="announcement-row__edit"
                            onClick={() =>
                                editAnnouncement(announcement)
                            }
                        >
                            Edit
                        </button>
                    </article>
                ))}
            </div>
        )}
    </section>
        </section>
    </div>
</main>
    );
}