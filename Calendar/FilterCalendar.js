(function () {
    const searchInput = document.getElementById("class-search");
    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");
    const filterStatus = document.getElementById("filter-status");
    const filterButtons = document.querySelectorAll("[data-filter]");

    let searchTerm = "";
    let startDate = "";
    let endDate = "";
    let selectedMode = "";
    let currentWeekOnly = false;

    function matchesCalendarFilter(classItem, occurrenceDate) {
        const className = String(classItem.name || "").toLowerCase();
        const mode = String(classItem.mode || "").trim().toLowerCase();

        if (selectedMode && mode !== selectedMode) {
            return false;
        }

        if (searchTerm && !className.includes(searchTerm)) {
            return false;
        }

        if (startDate && occurrenceDate < startDate) {
            return false;
        }

        if (endDate && occurrenceDate > endDate) {
            return false;
        }

        if (currentWeekOnly) {
            const today = new Date();
            const weekStart = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate() - today.getDay()
            );
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            const weekStartKey = formatDate(weekStart);
            const weekEndKey = formatDate(weekEnd);

            if (occurrenceDate < weekStartKey || occurrenceDate > weekEndKey) {
                return false;
            }
        }

        return true;
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    window.matchesCalendarFilter = matchesCalendarFilter;

    document.addEventListener("DOMContentLoaded", function () {
        function updateFilters() {
            searchTerm = searchInput.value.trim().toLowerCase();
            startDate = startDateInput.value;
            endDate = endDateInput.value;

            const invalidDateRange = startDate && endDate && startDate > endDate;
            endDateInput.setAttribute(
                "aria-invalid",
                invalidDateRange ? "true" : "false"
            );
            filterStatus.textContent = invalidDateRange
                ? "End date must be on or after the start date."
                : "";

            window.dispatchEvent(new Event("calendarFiltersChanged"));
        }

        filterButtons.forEach(button => {
            button.addEventListener("click", function () {
                const filter = button.dataset.filter;

                if (filter === "this week") {
                    currentWeekOnly = !currentWeekOnly;
                } else {
                    selectedMode = filter === "all" ? "" : filter;
                }

                filterButtons.forEach(filterButton => {
                    const buttonFilter = filterButton.dataset.filter;
                    const isPressed = buttonFilter === "this week"
                        ? currentWeekOnly
                        : buttonFilter === selectedMode ||
                            (buttonFilter === "all" && !selectedMode);

                    filterButton.setAttribute(
                        "aria-pressed",
                        String(isPressed)
                    );
                });

                updateFilters();
            });
        });

        searchInput.addEventListener("input", updateFilters);
        startDateInput.addEventListener("change", updateFilters);
        endDateInput.addEventListener("change", updateFilters);
        updateFilters();
    });
})();