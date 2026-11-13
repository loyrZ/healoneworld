/* Load the shared header on static public pages. */
async function loadHeader() {
    const container = document.querySelector("[data-site-header]");
    if (!container) return;
    const isEmbeddedCalendar =
    window.location.pathname === "/calendar/Calendar.html" &&
    new URLSearchParams(window.location.search).get("embedded") === "1";
    if (isEmbeddedCalendar) return;

    try {
        const [response, { initializeHeaderMenu }] = await Promise.all([
            fetch("/components/header.html"),
            import("/js/header-menu.js")
        ]);

        if (!response.ok) {
            throw new Error("Could not load the header.");
        }

        container.innerHTML = await response.text();
        initializeHeaderMenu(container);
    } catch (error) {
        console.error(error);
        container.textContent =
            "Navigation could not load. Please refresh.";
    }
}

loadHeader();