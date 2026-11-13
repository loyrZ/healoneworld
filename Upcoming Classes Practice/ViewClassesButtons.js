// HOW-141: Classes come from /api/classes through /js/class-schedule.js
// instead of the sample data in classes.js.
const classList = document.querySelector("#class-list");
function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}
// Loading and error messages for the class list. Kept separate from the cards
// so FilterButtons.js can keep its own "no matches" message in the list.
function showListStatus(text) {
  let status = classList.querySelector(".class-list-status");
  if (!status) {
    status = document.createElement("p");
    status.className = "class-list-status";
    status.setAttribute("role", "status");
    classList.prepend(status);
  }
  status.textContent = text;
  status.hidden = !text;
}
async function displayClasses() {
  if (!classList) {
    return;
  }
  const escapeHtml = window.ClassSchedule.escapeHtml;
  showListStatus("Loading classes…");
  let scheduledClasses;
  try {
    scheduledClasses = await window.ClassSchedule.loadSchedule();
  } catch {
    showListStatus("Classes could not be loaded. Please try again later.");
    return;
  }
  showListStatus(scheduledClasses.length ? "" : "No upcoming classes or events.");
  classList.querySelectorAll(".class-card").forEach((card) => card.remove());
  scheduledClasses.forEach((classItem) => {
    const card = document.createElement("article");
    card.className = "class-card";
    // Keep class metadata available to filters without parsing the displayed date or labels.
    card.dataset.modality = classItem.mode;
    card.dataset.title = classItem.name;
    card.dataset.date = classItem.date;
    card.innerHTML = `
      <eyebrow class="class-category">
        ${escapeHtml(classItem.mode.toUpperCase())}
      </eyebrow>
      <text class="class-title">
        ${escapeHtml(classItem.name)}
      </text>
      <time class="class-time">
        ${escapeHtml(formatDate(classItem.date))} • ${escapeHtml(classItem.startTime)}
      </time>
      <studio class="class-studio">
        ${escapeHtml(classItem.location || "Online")}
      </studio>
      <button
        class="class-button"
        aria-label="View details for ${escapeHtml(classItem.name)}"
        data-class-id="${escapeHtml(classItem.id)}"
        type="button"
      >
        View Details
      </button>
    `;
    classList.appendChild(card);
  });
  addViewDetailsButtons();
  // Let FilterButtons.js apply the current filters to the new cards.
  document.dispatchEvent(new Event("classesrendered"));
}
function addViewDetailsButtons() {
  document.querySelectorAll(".class-button").forEach((button) => {
    button.addEventListener("click", () => {
      const classId = button.dataset.classId;

      window.location.href = `/classes/ClassPage.html?id=${classId}`;
    });
  });
}
async function displayClassDetails() {
  const classId = new URLSearchParams(window.location.search).get("id");
  const title = document.querySelector('[data-detail-field="title"]');

  let selectedClass;
  try {
    selectedClass = await window.ClassSchedule.loadClass(classId);
  } catch {
    title.textContent = "This class could not be loaded. Please try again later.";
    return;
  }

  // Missing, invalid, or unpublished IDs: say so instead of showing an example class.
  if (!selectedClass) {
    title.textContent = "This class could not be found.";
    return;
  }
  const category = document.querySelector('[data-detail-field="category"]');
  const date = document.querySelector('[data-detail-field="date"]');
  const studio = document.querySelector('[data-detail-field="studio"]');
  const description = document.querySelector(
    '[data-detail-field="description"]'
  );
  const instructor = document.querySelector(
    '[data-detail-field="instructor"]'
  );
  document.title = `${selectedClass.name} | Heal One World`;
  title.textContent = selectedClass.name;
  if (category) {
    category.textContent = [selectedClass.mode, selectedClass.type]
      .filter(Boolean)
      .join(" • ");
  }
  if (date) {
    date.textContent =
      `${formatDate(selectedClass.date)} • ` +
      `${selectedClass.startTime}–${selectedClass.endTime}`;
  }
  if (studio) {
    studio.textContent = selectedClass.location || "Online";
  }
  if (description) {
    description.textContent = selectedClass.description;
  }
  if (instructor) {
    instructor.textContent = selectedClass.instructor;
  }
}
if (classList) {
  displayClasses();
}
if (document.querySelector('[data-detail-field="title"]')) {
  displayClassDetails();
}
