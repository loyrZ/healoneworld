document.addEventListener("DOMContentLoaded", () => {
  const ACTIVE_USER_KEY = "healOneWorldActiveUser";
  const REGISTRATIONS_KEY = "registrations";
  const MAX_CLASSES = 30;
  const filterButtons = document.querySelectorAll(".class-filters button");
  const classListContainer = document.querySelector(".registered-classes-list");
  const activeUserEmail = (localStorage.getItem(ACTIVE_USER_KEY) || "").trim().toLowerCase();
  function getRegistrations() {
    try {
      return JSON.parse(localStorage.getItem(REGISTRATIONS_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }
  function saveRegistrations(registrations) {
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations));
  }
  function getSeatCounts() {
    try {
      return JSON.parse(localStorage.getItem("seatCounts") || "{}");
    } catch (error) {
      return {};
    }
  }
  function saveSeatCounts(seatCounts) {
    localStorage.setItem("seatCounts", JSON.stringify(seatCounts));
  }
  function isDeleted(registration) {
    return (registration.status === "deleted" || registration.status === "cancelled");
  }
  function getUserRegistrations() {
    return getRegistrations().filter((registration) => {
      return (registration.email && registration.email.trim().toLowerCase() === activeUserEmail);
    });
  }
  function returnSeatToClass(registration) {
    const classItem = registration.class;
    const classId = classItem.id;
    if (registration.seatReleased === true) 
      return;
    const seatCounts = getSeatCounts();
    const currentSeats = seatCounts[classId] ?? classItem.seatsAvailable;
    seatCounts[classId] = Math.min(Number(classItem.seatsAvailable), Number(currentSeats) + 1);
    registration.seatReleased = true;
    saveSeatCounts(seatCounts);
  }
  function takeSeatFromClass(registration) {
    const classItem = registration.class;
    const classId = classItem.id;
    /*
      This protects older canceled registrations that were
      created before seatReleased was added.
    */
    if (registration.seatReleased !== true) {
      return true;
    }
    const seatCounts = getSeatCounts();
    const currentSeats = seatCounts[classId] ?? classItem.seatsAvailable;
    if (Number(currentSeats) <= 0) {
      return false;
    }
    seatCounts[classId] = Number(currentSeats) - 1;
    registration.seatReleased = false;
    saveSeatCounts(seatCounts);
    return true;
  }
  function getCurrentView() {
    const activeButton = document.querySelector(".class-filters button.active");
    if (!activeButton) {
      return "recent";
    }
    const text = activeButton.textContent.trim().toLowerCase();
    if (text.includes("past")) {
      return "past";
    }
    if (text.includes("upcoming")) {
      return "upcoming";
    }
    if (text.includes("deleted")) {
      return "deleted";
    }
    return "recent";
  }
  function refreshClasses(view) {
    if (typeof window.displayClasses === "function") {
      window.displayClasses(view);
    }
  }
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((otherButton) => {
        otherButton.classList.remove("active");
      });
      button.classList.add("active");
      const text = button.textContent.trim().toLowerCase();
      if (text.includes("past")) {
        refreshClasses("past");
      } else if (text.includes("upcoming")) {
        refreshClasses("upcoming");
      } else if (text.includes("deleted")) {
        refreshClasses("deleted");
      } else {
        refreshClasses("recent");
      }
    });
  });

  if (filterButtons.length > 0 && !document.querySelector(".class-filters button.active")) {
    filterButtons[0].classList.add("active");
  }
  classListContainer?.addEventListener("click", async (event) => {
    const clickedButton = event.target.closest("button");
    if (!clickedButton) 
      return;
    const action = clickedButton.dataset.action;
    const classId = Number(clickedButton.dataset.classId);
    if (!action || !classId) 
      return;
    if (action === "view-details") {
      const classPageUrl = new URL("../Upcoming%20Classes%20Practice/ClassPage.html", window.location.href);
      classPageUrl.searchParams.set("id", classId);
      window.location.href = classPageUrl.href;
      return;
    }
    let registrations = getRegistrations();
    const registrationIndex = registrations.findIndex((registration) => {
      return (registration.email && registration.email.trim().toLowerCase() === activeUserEmail && registration.class && Number(registration.class.id) === classId);
    });

    if (registrationIndex === -1) {
      return;
    }
    const registration = registrations[registrationIndex];
    if (action === "cancel") {
      const confirmed = confirm(`Cancel your registration for ${registration.class.name}?`);
      if (!confirmed) {
        return;
      }
      registrations[registrationIndex].status = "deleted";
      registrations[registrationIndex].cancelledAt = new Date().toISOString();
      returnSeatToClass(registrations[registrationIndex]);
      saveRegistrations(registrations);

      try {
        await window.sendClassNotification({
          to: registration.email,
          firstName: registration.firstName,
          className: registration.class.name,
          action: "cancelled",
          classDate: registration.class.date
            ? new Date(`${registration.class.date}T00:00:00`).toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric"
                }
              )
            : "",
          classTime:
            `${registration.class.startTime || ""}–` +
            `${registration.class.endTime || ""}`,
          classLocation:
            registration.class.location || "Online"
        });
      } catch (emailError) {
        console.error("Cancellation email failed:", emailError);
      }

      refreshClasses(getCurrentView());
      return;
    }

    if (action === "restore") {
      const activeClasses = getUserRegistrations().filter((item) => !isDeleted(item));
      if (activeClasses.length >= MAX_CLASSES) {
        alert(`You can only have ${MAX_CLASSES} active classes.`);
        return;
      }
      const seatAvailable = takeSeatFromClass(registration);
      if (!seatAvailable) {
        alert("This class is currently full.");
        return;
      }

      registrations[registrationIndex].status = "active";
      registrations[registrationIndex].restoredAt = new Date().toISOString();
      delete registrations[registrationIndex].cancelledAt;
      saveRegistrations(registrations);
      filterButtons.forEach((button) => {
        button.classList.remove("active");
      });
      const recentButton = [...filterButtons].find((button) =>
        button.textContent.trim().toLowerCase().includes("recent")
      );
      recentButton?.classList.add("active");
      refreshClasses("recent");
      return;
    }
    if (action === "delete-forever") {
      const confirmed = confirm("Delete this registration permanently?");
      if (!confirmed) {
        return;
      }
      registrations.splice(registrationIndex, 1);
      saveRegistrations(registrations);
      refreshClasses("deleted");
    }
  });
  const signOutButton = [...document.querySelectorAll("button")].find(
    (button) =>
      button.textContent.trim().toLowerCase() === "sign out"
  );
  signOutButton?.addEventListener("click", () => {
    localStorage.removeItem(ACTIVE_USER_KEY);
    window.location.href = "SignInPage.html";
  });
});