
// ---------- GET PAGE ELEMENTS ----------

const searchInput = document.getElementById("searchInput");
const formatFilter = document.getElementById("formatFilter");
const categoryFilter = document.getElementById("categoryFilter");
const dateFilter = document.getElementById("dateFilter");

const eventGrid = document.getElementById("eventGrid");
const eventCards = [...document.querySelectorAll(".event-card")];
const resultsCount = document.getElementById("resultsCount");
const noResults = document.getElementById("noResults");


// ---------- FILTER EVENTS ----------

function filterEvents() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedFormat = formatFilter.value;
  const selectedCategory = categoryFilter.value;
  const selectedDate = dateFilter.value;

  // Calculate the current Monday-Sunday week.
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const monday = new Date(today);
  const daysSinceMonday = (today.getDay() + 6) % 7;
  monday.setDate(today.getDate() - daysSinceMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  let visibleCount = 0;

  eventCards.forEach((card) => {
    const title = card.dataset.title.toLowerCase();
    const category = card.dataset.category;
    const format = card.dataset.format;

    const eventDate = new Date(
      `${card.dataset.date}T12:00:00`
    );

    const matchesSearch = title.includes(searchTerm);

    const matchesFormat =
      selectedFormat === "all" ||
      format === selectedFormat;

    const matchesCategory =
      selectedCategory === "all" ||
      category === selectedCategory;

    const matchesDate =
      selectedDate === "all" ||
      (
        eventDate >= monday &&
        eventDate <= sunday
      );

    const isVisible =
      matchesSearch &&
      matchesFormat &&
      matchesCategory &&
      matchesDate;

    card.hidden = !isVisible;

    if (isVisible) {
      visibleCount++;
    }
  });

  // Show a count of the matching events.
  resultsCount.textContent =
    `${visibleCount} ${visibleCount === 1 ? "class" : "classes"} found`;

  // Show a helpful message when nothing matches.
  noResults.hidden = visibleCount !== 0;

  // Hide the empty grid when no cards match.
  eventGrid.hidden = visibleCount === 0;
}


// Refilter when a control changes.
searchInput.addEventListener("input", filterEvents);
formatFilter.addEventListener("change", filterEvents);
categoryFilter.addEventListener("change", filterEvents);
dateFilter.addEventListener("change", filterEvents);


// ---------- CLASS DETAILS DIALOG ----------

const detailsDialog = document.getElementById("detailsDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogDescription = document.getElementById("dialogDescription");
const closeDialog = document.getElementById("closeDialog");
const dialogDone = document.getElementById("dialogDone");

document.querySelectorAll(".details-button[data-title]").forEach((button) => {
  button.addEventListener("click", () => {
    dialogTitle.textContent = button.dataset.title;
    dialogDescription.textContent = button.dataset.description;

    detailsDialog.showModal();
  });
});

closeDialog.addEventListener("click", () => {
  detailsDialog.close();
});

dialogDone.addEventListener("click", () => {
  detailsDialog.close();
});


// Close the dialog when the user clicks outside its content.
detailsDialog.addEventListener("click", (event) => {
  if (event.target === detailsDialog) {
    detailsDialog.close();
  }
});


// ---------- MOBILE NAVIGATION ----------

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Toggle navigation"
  );

  menuToggle.textContent = isOpen ? "×" : "☰";
});

// Close the mobile menu after selecting a navigation link.
mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Toggle navigation");
    menuToggle.textContent = "☰";
  });
});


// ---------- INITIALIZE ----------

filterEvents();