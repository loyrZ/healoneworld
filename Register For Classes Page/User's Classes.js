document.addEventListener("DOMContentLoaded", () => {
  const MAX_CLASSES = 30;
  const MAX_UPCOMING_CLASSES = 3;
  const classesSection = document.querySelector(".classes-section");
  const classFilters = document.querySelector(".class-filters");

  if (!classesSection) return;
  classesSection.querySelectorAll(".class-card").forEach((card) => card.remove());
  const classListContainer = document.createElement("div");
  classListContainer.className = "registered-classes-list";
  if (classFilters) classFilters.insertAdjacentElement("afterend", classListContainer);
  else classesSection.appendChild(classListContainer);

  function isDeleted(registration) {
    return registration.status === "cancelled";
  }

  function formatDate(dateString) {
    if (!dateString) return "Date unavailable";
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  function getClassStartDate(classItem) {
    // startTime is display text (for example, "4:31 PM"). The shared loader
    // supplies startKey in 24-hour time for comparisons and sorting.
    const date = new Date(`${classItem.date || ""}T${classItem.startKey || "00:00"}:00`);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }

  function getRegistrationTime(registration, originalIndex) {
    const registeredDate = new Date(registration.registeredAt);
    return Number.isNaN(registeredDate.getTime()) ? originalIndex : registeredDate.getTime();
  }

  function getLocation(classItem) {
    const format = classItem.format || classItem.mode;
    return classItem.location || (format === "virtual" || format === "Online" ? "Virtual" : "Location unavailable");
  }

  function showMessage(message) {
    classListContainer.innerHTML = "";
    const messageElement = document.createElement("p");
    messageElement.className = "no-registered-classes";
    messageElement.textContent = message;
    classListContainer.appendChild(messageElement);
  }

  async function getRegistrations() {
    const response = await fetch("/api/class-registrations/mine", { headers: { Accept: "application/json" } });
    const registrations = await response.json().catch(() => []);
    if (!response.ok || !Array.isArray(registrations)) {
      throw new Error(registrations.error || "Your classes could not be loaded.");
    }
    return registrations;
  }

  function createClassCard(registration, view) {
    const classItem = registration.class;
    const card = document.createElement("article");
    card.className = "class-card";
    const classInfo = document.createElement("div");
    classInfo.className = "class-info";
    const title = document.createElement("h2");
    title.textContent = classItem.title || classItem.name || "Class name unavailable";
    const dateAndTime = document.createElement("p");
    dateAndTime.textContent = `${formatDate(classItem.date)} • ${classItem.startTime || ""}–${classItem.endTime || ""}`;
    const location = document.createElement("p");
    location.textContent = `${classItem.format || classItem.mode || "Class"} • ${getLocation(classItem)}`;
    classInfo.append(title, dateAndTime, location);

    if (registration.status === "cancelled") {
      const status = document.createElement("p");
      status.className = "registration-status registration-status--cancelled";
      status.textContent = "Canceled";
      classInfo.appendChild(status);
    }

    const actions = document.createElement("div");
    actions.className = "class-actions";
    if (view === "deleted") {
      const restoreButton = document.createElement("button");
      restoreButton.type = "button";
      restoreButton.textContent = "Restore";
      restoreButton.dataset.action = "restore";
      restoreButton.dataset.registrationId = registration.id;
      actions.appendChild(restoreButton);
    } else {
      const detailsButton = document.createElement("button");
      detailsButton.type = "button";
      detailsButton.textContent = "View details";
      detailsButton.dataset.action = "view-details";
      detailsButton.dataset.classId = classItem.id;
      actions.appendChild(detailsButton);
      if (
        registration.status === "registered" &&
        ["virtual", "hybrid", "Online", "Hybrid"].includes(classItem.format || classItem.mode)
      ) {
        const meetingButton = document.createElement("button");
        meetingButton.type = "button";
        meetingButton.textContent = "Join online class";
        meetingButton.dataset.action = "join-meeting";
        meetingButton.dataset.classId = classItem.id;
        actions.appendChild(meetingButton);
      }
      if (view !== "upcoming") {
        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.textContent = "Cancel registration";
        cancelButton.dataset.action = "cancel";
        cancelButton.dataset.registrationId = registration.id;
        cancelButton.dataset.className = classItem.title;
        actions.appendChild(cancelButton);
      }
    }
    card.append(classInfo, actions);
    return card;
  }

  window.displayClasses = async function displayClasses(view) {
    classListContainer.innerHTML = "";
    if (view === "upcoming") {
      if (!window.ClassSchedule) return showMessage("Upcoming classes could not be loaded.");
      try {
        const classes = await window.ClassSchedule.loadSchedule();
        const currentTime = Date.now();
        // Show the next three classes that have not started yet, earliest first.
        const upcomingClasses = classes
          .map((classItem) => ({
            classItem,
            startTime: getClassStartDate(classItem)
          }))
          .filter(({ startTime }) => startTime !== null && startTime >= currentTime)
          .sort((a, b) => a.startTime - b.startTime)
          .slice(0, MAX_UPCOMING_CLASSES);
        if (!upcomingClasses.length) return showMessage("There are no upcoming classes.");
        upcomingClasses.forEach(({ classItem }) => classListContainer.appendChild(createClassCard({ class: classItem }, "upcoming")));
      } catch (error) {
        console.error("Upcoming classes could not be loaded:", error);
        showMessage("Upcoming classes could not be loaded.");
      }
      return;
    }

    try {
      const registrations = await getRegistrations();
      const activeRegistrations = registrations
        .map((registration, index) => ({ registration, index }))
        .filter(({ registration }) => !isDeleted(registration));
      const deletedRegistrations = registrations.filter(isDeleted);
      if (view === "deleted") {
        if (!deletedRegistrations.length) return showMessage("You do not have any deleted classes.");
        deletedRegistrations.slice(0, MAX_CLASSES).forEach((registration) => classListContainer.appendChild(createClassCard(registration, "deleted")));
        return;
      }
      if (!activeRegistrations.length) return showMessage("You are not registered for any classes.");
      const newestRegistrations = [...activeRegistrations].sort((a, b) => getRegistrationTime(b.registration, b.index) - getRegistrationTime(a.registration, a.index));
      const classesToDisplay = view === "recent" ? newestRegistrations.slice(0, 3) : newestRegistrations.slice(3, MAX_CLASSES);
      if (!classesToDisplay.length) return showMessage(`You do not have any ${view} classes.`);
      classesToDisplay.forEach(({ registration }) => classListContainer.appendChild(createClassCard(registration, view)));
    } catch (error) {
      console.error("Your classes could not be loaded:", error);
      showMessage(error.message || "Your classes could not be loaded.");
    }
  };

  window.displayClasses("recent");
});