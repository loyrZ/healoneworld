document.addEventListener("DOMContentLoaded", function () {
    const monthYear = document.getElementById("month-year");
    const daysContainer = document.getElementById("days");
    const prevButton = document.getElementById("prev");
    const nextButton = document.getElementById("next");
    const sidebar = document.getElementById("class-sidebar");
    const classDetails = document.getElementById("class-details");
    const closeSidebar = document.getElementById("close-sidebar");
    const months = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];
    let currentDate = new Date();
    currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
    );
    const today = new Date();
    function getClassColor(type) {
        switch (type) {
            case "Yoga":
                return "yoga";
            case "Reiki":
                return "reiki";
            case "Tai Chi":
                return "tai-chi";
            default:
                return "other";
        }
    }
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }
    function openSidebar(content) {
        classDetails.innerHTML = content;
        sidebar.classList.add("open");
    }
    function showClassDetails(classItem, occurrenceDate) {
        const details = [
            `Class: ${classItem.name}`,
            `Type: ${classItem.type}`,
            `Date: ${occurrenceDate}`,
            `Time: ${classItem.startTime}` +
                (classItem.endTime ? ` - ${classItem.endTime}` : ""),
            `Format: ${classItem.mode}`,
            classItem.instructor
                ? `Instructor: ${classItem.instructor}`
                : "",
            classItem.location
                ? `Location: ${classItem.location}`
                : "",
            classItem.status
                ? `Status: ${classItem.status}`
                : ""
        ].filter(Boolean);

        openSidebar(
            details
                .map(detail => `<p>${detail}</p>`)
                .join("")
        );
        const classLink = document.createElement("a");
        classLink.href = classItem.classUrl;
        classLink.textContent = "Go to Class";
        classDetails.appendChild(classLink);
    }
    closeSidebar.addEventListener("click", function () {
        sidebar.classList.remove("open");
    });
    function createDayCell(date, isCurrentMonth) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("calendar-day");

        if (!isCurrentMonth) {
            dayDiv.classList.add("outside-month");
        }
        const dateKey = formatDate(date);
        const dayNumber = document.createElement("div");
        dayNumber.classList.add("day-number");
        dayNumber.textContent = date.getDate();
        if (dateKey === formatDate(today)) {
            dayNumber.classList.add("today");
        }
        dayDiv.appendChild(dayNumber);

        const dayClasses = classes
            .filter(classItem =>
                new Date(`${classItem.date}T00:00:00`).getDay() === date.getDay() &&
                classItem.status !== "Cancelled" &&
                (
                    typeof window.matchesCalendarFilter !== "function" ||
                    window.matchesCalendarFilter(classItem, dateKey)
                )
            )
            .sort((a, b) =>
                a.startTime.localeCompare(b.startTime)
            );

        const maxVisible = 2;
        const visibleClasses = dayClasses.slice(0, maxVisible);

        visibleClasses.forEach(classItem => {
            const eventDiv = document.createElement("button");

            eventDiv.type = "button";
            eventDiv.classList.add(
                "class-event",
                getClassColor(classItem.type)
            );

            eventDiv.textContent =
                `${classItem.startTime} ${classItem.name}`;

            eventDiv.title =
                `${classItem.name} | ${classItem.startTime}` +
                ` | ${classItem.mode}`;

            eventDiv.addEventListener("click", function (event) {
                event.stopPropagation();
                showClassDetails(classItem, dateKey);
            });

            dayDiv.appendChild(eventDiv);
        });

        if (dayClasses.length > maxVisible) {
            const moreDiv = document.createElement("button");

            moreDiv.type = "button";
            moreDiv.classList.add("more-events");
            moreDiv.textContent =
                `+${dayClasses.length - maxVisible} more`;

            moreDiv.addEventListener("click", function (event) {
                event.stopPropagation();

                openSidebar("");

                const heading = document.createElement("p");
                heading.textContent = `Classes on ${dateKey}`;
                classDetails.appendChild(heading);

                dayClasses.slice(maxVisible).forEach(item => {
                    const classButton = document.createElement("button");
                    classButton.type = "button";
                    classButton.classList.add(
                        "class-event",
                        getClassColor(item.type)
                    );
                    classButton.textContent =
                        `${item.startTime} - ${item.name} (${item.mode})`;
                    classButton.addEventListener("click", function () {
                        showClassDetails(item, dateKey);
                    });
                    classDetails.appendChild(classButton);
                });
            });

            dayDiv.appendChild(moreDiv);
        }

        return dayDiv;
    }

    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();

        monthYear.textContent = `${months[month]} ${year}`;
        daysContainer.innerHTML = "";

        const firstOfMonth = new Date(year, month, 1);
        const firstWeekday = firstOfMonth.getDay();

        const lastOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastOfMonth.getDate();

        const previousMonthLastDate =
            new Date(year, month, 0).getDate();

        for (let i = firstWeekday - 1; i >= 0; i--) {
            const day = previousMonthLastDate - i;
            const dateToRender = new Date(year, month - 1, day);

            daysContainer.appendChild(
                createDayCell(dateToRender, false)
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateToRender = new Date(year, month, day);

            daysContainer.appendChild(
                createDayCell(dateToRender, true)
            );
        }

        const totalCells = daysContainer.children.length;
        const remainingCells = (7 - (totalCells % 7)) % 7;

        for (let day = 1; day <= remainingCells; day++) {
            const dateToRender = new Date(year, month + 1, day);

            daysContainer.appendChild(
                createDayCell(dateToRender, false)
            );
        }
    }

    window.addEventListener("calendarFiltersChanged", function () {
        renderCalendar(currentDate);
    });

    prevButton.addEventListener("click", function () {
        currentDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - 1,
            1
        );

        renderCalendar(currentDate);
    });

    nextButton.addEventListener("click", function () {
        currentDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            1
        );

        renderCalendar(currentDate);
    });

    renderCalendar(currentDate);
});
