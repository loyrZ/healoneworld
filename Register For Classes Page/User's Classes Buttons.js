document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".class-filters button");
  const classListContainer = document.querySelector(".registered-classes-list");

  function getCurrentView() {
    const text = document.querySelector(".class-filters button.active")?.textContent.trim().toLowerCase() || "recent";
    if (text.includes("past")) return "past";
    if (text.includes("upcoming")) return "upcoming";
    if (text.includes("deleted")) return "deleted";
    return "recent";
  }

  function refreshClasses(view) {
    if (typeof window.displayClasses === "function") window.displayClasses(view);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((otherButton) => otherButton.classList.remove("active"));
      button.classList.add("active");
      refreshClasses(getCurrentView());
    });
  });

  if (filterButtons.length && !document.querySelector(".class-filters button.active")) filterButtons[0].classList.add("active");

  classListContainer?.addEventListener("click", async (event) => {
    const clickedButton = event.target.closest("button");
    if (!clickedButton) return;
    const action = clickedButton.dataset.action;
    if (action === "view-details") {
      const classId = Number(clickedButton.dataset.classId);
      if (!classId) return;
      const classPageUrl = new URL("/classes/ClassPage.html", window.location.origin);
      classPageUrl.searchParams.set("id", classId);
      window.location.href = classPageUrl.href;
      return;
    }

    if (action === "join-meeting") {
      const classId = Number(clickedButton.dataset.classId);
      if (!classId) return;
      clickedButton.disabled = true;
      clickedButton.textContent = "Opening...";
      try {
        const response = await fetch(`/api/class-registrations/class/${classId}/meeting`, { headers: { Accept: "application/json" } });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.meetingLink) {
          throw new Error(result.error || "The online meeting is unavailable.");
        }
        window.location.assign(result.meetingLink);
      } catch (error) {
        alert(error.message || "The online meeting is unavailable.");
        clickedButton.disabled = false;
        clickedButton.textContent = "Join online class";
      }
      return;
    }

    const registrationId = Number(clickedButton.dataset.registrationId);
    if (!registrationId) return;
    if (action === "cancel") {
      const confirmed = confirm(`Cancel your registration for ${clickedButton.dataset.className || "this class"}?`);
      if (!confirmed) return;
      clickedButton.disabled = true;
      clickedButton.textContent = "Canceling...";
      try {
        const response = await fetch(`/api/class-registrations/${registrationId}/cancel`, { method: "POST", headers: { Accept: "application/json" } });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Your cancellation could not be saved.");
        refreshClasses(getCurrentView());
      } catch (error) {
        alert(error.message || "Your cancellation could not be saved.");
        clickedButton.disabled = false;
        clickedButton.textContent = "Cancel registration";
      }
      return;
    }

    if (action === "restore") {
      clickedButton.disabled = true;
      clickedButton.textContent = "Restoring...";
      try {
        const response = await fetch(`/api/class-registrations/${registrationId}/restore`, { method: "POST", headers: { Accept: "application/json" } });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Your registration could not be restored.");
        filterButtons.forEach((button) => button.classList.remove("active"));
        filterButtons[0]?.classList.add("active");
        refreshClasses("recent");
      } catch (error) {
        alert(error.message || "Your registration could not be restored.");
        clickedButton.disabled = false;
        clickedButton.textContent = "Restore";
      }
    }
  });

  const signOutButton = [...document.querySelectorAll("button")].find((button) => button.textContent.trim().toLowerCase() === "sign out");
  signOutButton?.addEventListener("click", () => {
    window.location.href = "/sign-in";
  });
});