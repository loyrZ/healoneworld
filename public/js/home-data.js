async function getList(url) {
    const response = await fetch(url, {
        headers: { Accept: "application/json" }
    });

    if (!response.ok) {
        throw new Error("Content could not load.");
    }

    const items = await response.json();

    if (!Array.isArray(items)) {
        throw new Error("Expected a list.");
    }

    return items;
}

export async function getWeeklyClasses() {
    const classes = await getList("/api/classes");

    // This week runs from Monday through Sunday.
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return classes
        .filter((item) => {
            const date = new Date(`${item.date}T00:00:00`);
            return date >= start && date < end;
        })
        .sort((a, b) =>
            `${a.date}T${a.startTime}`.localeCompare(
                `${b.date}T${b.startTime}`
            )
        )
        .slice(0, 3);
}

export async function getPublishedAnnouncements() {
    const announcements = await getList("/announcements");

    return announcements
        .sort((a, b) =>
            new Date(b.published_at) - new Date(a.published_at) ||
            Number(b.id_pk) - Number(a.id_pk)
        )
        .slice(0, 1);
}