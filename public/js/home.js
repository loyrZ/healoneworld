import {
    getWeeklyClasses,
    getPublishedAnnouncements
} from "./home-data.js";

function createText(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;

    if (className) element.className = className;

    return element;
}

function formatTime(value) {
    if (!value) return "";

    const [hours, minutes] = value.split(":").map(Number);

    return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${
        hours < 12 ? "AM" : "PM"
    }`;
}

function createClassCard(item) {
    const card = document.createElement("article");
    card.className = "class-card";

    const formats = {
        in_person: "In person",
        virtual: "Online",
        hybrid: "Hybrid"
    };

    const date = new Date(`${item.date}T00:00:00`);
    const day = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
    });

    const details = document.createElement("a");
    details.href = `/classes/ClassPage.html?id=${encodeURIComponent(item.id)}`;
    details.textContent = "View details →";
    details.setAttribute("aria-label", `View details for ${item.title}`);

    card.append(
        createText("p", formats[item.format] || item.format, "class-format"),
        createText("h3", item.title),
        createText(
            "p",
            `${day} · ${formatTime(item.startTime)}–${formatTime(item.endTime)}`
        ),
        createText(
            "p",
            item.format === "virtual"
                ? "Online"
                : item.location || "Location to be announced"
        ),
        details
    );

    return card;
}

function createAnnouncementCard(item) {
    const card = document.createElement("article");
    card.className = "class-card";

    card.append(
        createText("h3", item.title),
        createText("p", item.message)
    );

    if (item.published_at) {
        const date = new Date(item.published_at);

        if (!Number.isNaN(date.getTime())) {
            const time = createText(
                "time",
                date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                })
            );

            time.dateTime = date.toISOString();
            card.append(time);
        }
    }

    return card;
}

async function loadSection(selector, loadItems, createCard, messages) {
    const container = document.querySelector(selector);
    if (!container) return;

    const status = createText("p", messages.loading, "content-status");
    status.setAttribute("role", "status");
    container.replaceChildren(status);

    try {
        const items = await loadItems();

        if (items.length === 0) {
            status.textContent = messages.empty;
            return;
        }

        container.replaceChildren(...items.map(createCard));
    } catch (error) {
        console.error("Homepage section could not load:", error);
        status.textContent = messages.error;
    }
}

// Each section loads independently so one failure does not hide the other.
loadSection("#weekly-classes", getWeeklyClasses, createClassCard, {
    loading: "Loading this week's classes…",
    empty: "No classes are scheduled for this week. Check the full calendar.",
    error: "Classes could not load. Please refresh to try again."
});

loadSection(
    "#homepage-announcements",
    getPublishedAnnouncements,
    createAnnouncementCard,
    {
        loading: "Loading announcements…",
        empty: "There are no announcements right now.",
        error: "Announcements could not load. Please refresh to try again."
    }
);