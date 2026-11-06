/*
 * HOW-141: Loads published classes from GET /api/classes for the public
 * calendar (Calendar/calendar.js) and class pages
 * (Upcoming Classes Practice/ViewClassesButtons.js).
 * Replaces the sample data in CalendarDatabase.js and classes.js, so new
 * classes appear without copying them into those files.
 * Served at /js/class-schedule.js by routes/index.js.
 */

//  Claude Revised 

(function () {
    // Labels the existing calendar and list filters already use.
    const MODE_LABELS = {
        in_person: "In person",
        virtual: "Online",
        hybrid: "Hybrid"
    };

    // "18:00" -> "6:00 PM"
    function to12Hour(time) {
        if (!time) return "";
        const [hours, minutes] = time.split(":").map(Number);
        const suffix = hours < 12 ? "AM" : "PM";
        return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
    }

    // Converts an API class to the shape the calendar and class pages were written for.
    function toScheduleItem(item) {
        return {
            id: item.id,
            name: item.title,
            type: "",
            date: item.date,
            startTime: to12Hour(item.startTime),
            endTime: to12Hour(item.endTime),
            // 24-hour start time, for sorting.
            startKey: item.startTime,
            mode: MODE_LABELS[item.format] || item.format,
            instructor: item.instructor,
            location: item.location,
            description: item.description,
            capacity: item.capacity,
            status: "Scheduled",
            classUrl: `/classes/ClassPage.html?id=${item.id}`
        };
    }

    async function getJson(url) {
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        return response.json();
    }

    // All published classes. Throws if they could not be loaded.
    async function loadSchedule() {
        const items = await getJson("/api/classes");
        return (items || []).map(toScheduleItem);
    }

    // One published class, or null when the ID is missing, invalid, or unknown.
    async function loadClass(id) {
        if (!/^[1-9]\d{0,9}$/.test(String(id || ""))) return null;
        const item = await getJson(`/api/classes/${id}`);
        return item ? toScheduleItem(item) : null;
    }

    // Class details are typed by admins and volunteers; escape them before using innerHTML.
    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    window.ClassSchedule = { loadSchedule, loadClass, escapeHtml };
})();
