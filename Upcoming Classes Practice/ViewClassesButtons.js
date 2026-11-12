const classList = document.querySelector("#class-list");
function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}
function getAvailableSeats(classItem) {
    const seatCounts = JSON.parse(
        localStorage.getItem("seatCounts") || "{}"
    );

    return seatCounts[classItem.id] ?? classItem.seatsAvailable;
}
function displayClasses() {
  if (!classList) {
    return;
  }
  classList.innerHTML = "";
  const scheduledClasses = classes.filter(
    (classItem) => classItem.status === "Scheduled"
  );
  scheduledClasses.forEach((classItem) => {
    const card = document.createElement("article");
    card.className = "class-card";
    // Keep class metadata available to filters without parsing the displayed date or labels.
    card.dataset.modality = classItem.mode;
    card.dataset.title = classItem.name;
    card.dataset.date = classItem.date;
    card.innerHTML = `
      <eyebrow class="class-category">
        ${classItem.mode.toUpperCase()}
      </eyebrow>
      <text class="class-title">
        ${classItem.name}
      </text>
      <time class="class-time">
        ${formatDate(classItem.date)} • ${classItem.startTime}
      </time>
      <studio class="class-studio">
        ${classItem.location || "Online"}
      </studio>
      <button
        class="class-button"
        data-class-id="${classItem.id}"
        type="button"
      >
        View Details
      </button>
    `;
    classList.appendChild(card);
  });
  addViewDetailsButtons();
}
function addViewDetailsButtons() {
  document.querySelectorAll(".class-button").forEach((button) => {
    button.addEventListener("click", () => {
      const classId = button.dataset.classId;

      window.location.href = `ClassPage.html?id=${classId}`;
    });
  });
}
function displayClassDetails() {
  const classId = Number(
    new URLSearchParams(window.location.search).get("id")
  );

  const selectedClass = classes.find(
    (classItem) => classItem.id === classId
  );

  if (!selectedClass) {
    return;
  }
  const title = document.querySelector('[data-detail-field="title"]');
  const category = document.querySelector('[data-detail-field="category"]');
  const date = document.querySelector('[data-detail-field="date"]');
  const studio = document.querySelector('[data-detail-field="studio"]');
  const description = document.querySelector(
    '[data-detail-field="description"]'
  );
  const instructor = document.querySelector(
    '[data-detail-field="instructor"]'
  );
  const spots = document.querySelector('[data-detail-field="spots"]');
  if (title) {
    title.textContent = selectedClass.name;
  }
  if (category) {
    category.textContent = `${selectedClass.mode} • ${selectedClass.type}`;
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
  if (spots) {
    spots.textContent =`${getAvailableSeats(selectedClass)} spots available`;
  }
}
if (classList) {
  displayClasses();
}
if (document.querySelector('[data-detail-field="title"]')) {
  displayClassDetails();
}
