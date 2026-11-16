document.addEventListener("DOMContentLoaded", () => {
  const ACTIVE_USER_KEY = "healOneWorldActiveUser";
  const REGISTRATIONS_KEY = "registrations";
  const MAX_CLASSES = 30;
  const MAX_UPCOMING_CLASSES = 3;
  const classesSection = document.querySelector(".classes-section");
  const classFilters = document.querySelector(".class-filters");

  if (!classesSection) 
    return;
  classesSection.querySelectorAll(".class-card").forEach((card) => card.remove());
  const classListContainer = document.createElement("div");
  classListContainer.className = "registered-classes-list";

  if (classFilters) 
    classFilters.insertAdjacentElement("afterend", classListContainer);
  else 
    classesSection.appendChild(classListContainer);

  function getRegistrations() {
    try {
      return JSON.parse(localStorage.getItem(REGISTRATIONS_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function getActiveUserEmail() {
    return (localStorage.getItem(ACTIVE_USER_KEY) || "").trim().toLowerCase();
  }

  function isDeleted(registration) {
    return (registration.status === "deleted" ||registration.status === "cancelled");
  }

  function removeExpiredDeletedRegistrations() {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const currentTime = Date.now();

    const registrations = getRegistrations();

    const remainingRegistrations = registrations.filter((registration) => {
        if (!isDeleted(registration) || !registration.cancelledAt)
          return true;
        const cancelledTime = new Date(registration.cancelledAt).getTime();
        return currentTime - cancelledTime < oneWeek;
      });

    if (remainingRegistrations.length !== registrations.length) {
      localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(remainingRegistrations));
    }
  }

  function getUserRegistrations() {
    const activeUserEmail = getActiveUserEmail();
    return getRegistrations().filter((registration) => {
      return (registration.email && registration.email.trim().toLowerCase() === activeUserEmail && registration.class);
    });
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "Date unavailable";
    }
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
  }

  function getClassStartDate(classItem) {
    const dateMatch = String(classItem.date || "").match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );
    if (!dateMatch)
      return null;
    const date = new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]));
    if (date.getFullYear() !== Number(dateMatch[1]) || date.getMonth() !== Number(dateMatch[2]) - 1 || date.getDate() !== Number(dateMatch[3])) {
      return null;
    }
    const startTime = String(classItem.startTime || "").trim();
    if (startTime) {
      const timeMatch = startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!timeMatch) 
        return null;
      let hour = Number(timeMatch[1]);
      const minute = Number(timeMatch[2]);
      const period = timeMatch[3]?.toUpperCase();

      if (minute > 59 || (period && (hour < 1 || hour > 12)) || (!period && hour > 23)) 
        return null;
      if (period === "PM" && hour !== 12) 
        hour += 12;
      else if (period === "AM" && hour === 12)
        hour = 0;
      date.setHours(hour, minute, 0, 0);
    }
    return date.getTime();
  }
  function getRegistrationTime(registration, originalIndex) {
    if (registration.registeredAt) {
      const registeredDate = new Date(registration.registeredAt);
      if (!Number.isNaN(registeredDate.getTime())) {
        return registeredDate.getTime();
      }
    }
    return originalIndex;
  }
  function getLocation(classItem) {
    if (classItem.mode === "Online") {
      return "Virtual";
    }
    return classItem.location || "Location unavailable";
  }
  function showMessage(message) {
    classListContainer.innerHTML = "";
    const messageElement = document.createElement("p");
    messageElement.className = "no-registered-classes";
    messageElement.textContent = message;
    classListContainer.appendChild(messageElement);
  }
  function createClassCard(registration, view) {
    const classItem = registration.class;
    const card = document.createElement("article");
    card.className = "class-card";
    const classInfo = document.createElement("div");
    classInfo.className = "class-info";
    const title = document.createElement("h2");
    title.textContent = classItem.name || "Class name unavailable";
    const dateAndTime = document.createElement("p");
    dateAndTime.textContent = `${formatDate(classItem.date)} • ` + `${classItem.startTime || ""}–${classItem.endTime || ""}`;
    const location = document.createElement("p");
    location.textContent = `${classItem.mode || "Class"} • ${getLocation(classItem)}`;
    classInfo.appendChild(title);
    classInfo.appendChild(dateAndTime);
    classInfo.appendChild(location);
    const actions = document.createElement("div");
    actions.className = "class-actions";
    if (view === "deleted") {
      const restoreButton = document.createElement("button");
      restoreButton.type = "button";
      restoreButton.textContent = "Restore";
      restoreButton.dataset.action = "restore";
      restoreButton.dataset.classId = classItem.id;
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete forever";
      deleteButton.dataset.action = "delete-forever";
      deleteButton.dataset.classId = classItem.id;
      actions.appendChild(restoreButton);
      actions.appendChild(deleteButton);
    } 
    else {
      const detailsButton = document.createElement("button");
      detailsButton.type = "button";
      detailsButton.textContent = "View details";
      detailsButton.dataset.action = "view-details";
      detailsButton.dataset.classId = classItem.id;
      actions.appendChild(detailsButton);
      /*
        Upcoming classes only show View details.
        Recent and Past classes also show Cancel registration.
      */
      if (view !== "upcoming") {
        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.textContent = "Cancel registration";
        cancelButton.dataset.action = "cancel";
        cancelButton.dataset.classId = classItem.id;
        actions.appendChild(cancelButton);
      }
    }
    card.appendChild(classInfo);
    card.appendChild(actions);
    return card;
  }

  window.displayClasses = function displayClasses(view) {
    classListContainer.innerHTML = "";
    if (view === "upcoming") {
      if (typeof classes === "undefined" || !Array.isArray(classes)) {
        showMessage("Upcoming classes could not be loaded.");
        return;
      }
      const currentTime = Date.now();
      const upcomingClasses = classes
        .map((classItem) => ({
          classItem,
          startTime: getClassStartDate(classItem)
        }))
        .filter(({ startTime }) => {
          return startTime !== null && startTime >= currentTime;
        })
        .sort((a, b) => a.startTime - b.startTime)
        .slice(0, MAX_UPCOMING_CLASSES);

      if (upcomingClasses.length === 0) {
        showMessage("There are no upcoming classes.");
        return;
      }
      upcomingClasses.forEach(({ classItem }) => {
        classListContainer.appendChild(
          createClassCard({ class: classItem }, "upcoming")
        );
      });
      return;
    }

    removeExpiredDeletedRegistrations();
    const activeUserEmail = getActiveUserEmail();
    if (!activeUserEmail) {
      showMessage("Please sign in to view your registered classes.");
      return;
    }
    const userRegistrations = getUserRegistrations();
    const activeRegistrations = userRegistrations
      .map((registration, index) => ({
        registration,
        index
      }))
      .filter(({ registration }) => !isDeleted(registration));
    const deletedRegistrations = userRegistrations.filter(
      (registration) => isDeleted(registration)
    );
    if (view === "deleted") {
      if (deletedRegistrations.length === 0) {
        showMessage("You do not have any deleted classes.");
        return;
      }
      deletedRegistrations
        .slice(0, MAX_CLASSES)
        .forEach((registration) => {
          classListContainer.appendChild(
            createClassCard(registration, "deleted")
          );
        });

      return;
    }
    if (activeRegistrations.length === 0) {
      showMessage("You are not registered for any classes.");
      return;
    }
    const newestRegistrations = [...activeRegistrations].sort(
      (a, b) => {
        return (
          getRegistrationTime(b.registration, b.index) -
          getRegistrationTime(a.registration, a.index)
        );
      }
    );
    let classesToDisplay = [];
    if (view === "recent") {
      classesToDisplay = newestRegistrations.slice(0, 3);
    }
    if (view === "past") {
      classesToDisplay = newestRegistrations.slice(3, MAX_CLASSES);
    }
    if (classesToDisplay.length === 0) {
      showMessage(`You do not have any ${view} classes.`);
      return;
    }
    classesToDisplay.forEach((item) => {
      const registration = item.registration || item;
      classListContainer.appendChild(
        createClassCard(registration, view)
      );
    });
  };
  window.displayClasses("recent");
});