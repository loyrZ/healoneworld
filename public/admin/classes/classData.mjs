// HOW-104, HOW-113: Shared helpers for the admin class pages.
// Plain JavaScript (no JSX) so tests/admin-class-filters.test.js can import it.
//  Claude Revised 

export const FORMAT_LABELS = {
    in_person: "In person",
    virtual: "Virtual",
    hybrid: "Hybrid",
};

export const STATUS_LABELS = {
    published: "Published",
    pending: "Pending approval",
};

export const TIME_ZONE_LABELS = {
    "America/Los_Angeles": "Pacific Time (Los Angeles)",
};

export const NO_FILTERS = {
    search: "",
    from: "",
    to: "",
    status: "all",
    instructor: "all",
};

// Every filter is optional; any combination narrows the list.
// Dates are YYYY-MM-DD strings, so they compare correctly as text.
export function filterClasses(classes, filters) {
    const search = filters.search.trim().toLocaleLowerCase();

    return classes.filter((item) =>
        (!search || item.title.toLocaleLowerCase().includes(search)) &&
        (!filters.from || (item.date && item.date >= filters.from)) &&
        (!filters.to || (item.date && item.date <= filters.to)) &&
        (filters.status === "all" || item.status === filters.status) &&
        (filters.instructor === "all" || item.instructor === filters.instructor)
    );
}

export function instructorsOf(classes) {
    return [...new Set(classes.map((item) => item.instructor))].sort((a, b) =>
        a.localeCompare(b)
    );
}

// "Nov 20"
export function formatShortDate(date) {
    if (!date) return "Date not set";
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

// "18:00" -> "6 PM", "17:30" -> "5:30 PM"
export function formatTime(time) {
    if (!time) return "";
    const [hours, minutes] = time.split(":").map(Number);
    const suffix = hours < 12 ? "AM" : "PM";
    const hour = hours % 12 || 12;
    return minutes ? `${hour}:${String(minutes).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}

export function registrationLabel(item) {
    if (item.registrationCount === null || item.registrationCount === undefined) {
        return "Registrations unavailable";
    }
    return `${item.registrationCount} registered`;
}

// Edit-form values are all strings, matching what the inputs hold.
export function toFormValues(item) {
    return {
        title: item.title ?? "",
        description: item.description ?? "",
        date: item.date ?? "",
        startTime: item.startTime ?? "",
        endTime: item.endTime ?? "",
        timeZone: item.timeZone ?? "America/Los_Angeles",
        format: item.format ?? "in_person",
        location: item.location ?? "",
        meetingLink: item.meetingLink ?? "",
        instructor: item.instructor ?? "",
        capacity: item.capacity === null || item.capacity === undefined ? "" : String(item.capacity),
    };
}
