const form = document.querySelector("#registration-form");
const errorMessage = document.querySelector("#form-error");

form.noValidate = true;

const classId = Number(
  new URLSearchParams(window.location.search).get("id")
);

const selectedClass = classes.find(
  (classItem) => classItem.id === classId
);

function showError(message) {
  errorMessage.textContent = message;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function getRegistrations() {
  return JSON.parse(
    localStorage.getItem("registrations") || "[]"
  );
}

function getAvailableSeats() {
  const seatCounts = JSON.parse(
    localStorage.getItem("seatCounts") || "{}"
  );

  return (
    seatCounts[classId] ??
    selectedClass.seatsAvailable
  );
}

function displayClass() {
  if (!selectedClass) {
    showError("Class information could not be found.");
    return;
  }

  document.querySelector("#registration-title").textContent =
    `Register for ${selectedClass.name}`;

  document.querySelector("#class-name").textContent =
    selectedClass.name;

  document.querySelector("#class-date").textContent =
    formatDate(selectedClass.date);

  document.querySelector("#class-time").textContent =
    `${selectedClass.startTime}–${selectedClass.endTime}`;

  document.querySelector("#class-mode").textContent =
    selectedClass.mode;

  document.querySelector("#class-location").textContent =
    selectedClass.location || "Online";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  showError("");

  const firstName = document
    .querySelector("#first-name")
    .value
    .trim();

  const lastName = document
    .querySelector("#last-name")
    .value
    .trim();

  const email = document
    .querySelector("#email")
    .value
    .trim()
    .toLowerCase();

  const phone = document
    .querySelector("#phone")
    .value
    .trim();

  const accessibility = document
    .querySelector("#accessibility")
    .value
    .trim();

  const phoneDigits = phone.replace(/\D/g, "");

  if (!firstName || !lastName || !email || !phone) {
    showError(
      "Please complete all required fields before registering."
    );

    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError("Please enter a valid email address.");
    return;
  }

  if (phoneDigits.length !== 10) {
    showError(
      "Please enter a valid 10-digit phone number."
    );

    return;
  }

  if (!selectedClass) {
    showError("Class information could not be found.");
    return;
  }

  const registrations = getRegistrations();

  const alreadyRegistered = registrations.some(
    (registration) => {
      return (
        registration.class &&
        Number(registration.class.id) === classId &&
        registration.email &&
        registration.email.toLowerCase() === email
      );
    }
  );

  if (alreadyRegistered) {
    showError(
      "You have already registered for this class."
    );

    return;
  }

  const availableSeats = getAvailableSeats();

  if (availableSeats <= 0) {
    showError("This class is currently full.");
    return;
  }

  const registration = {
    class: selectedClass,
    firstName: firstName,
    lastName: lastName,
    email: email,
    phone: phoneDigits,
    accessibility: accessibility,
    status: "active",
    registeredAt: new Date().toISOString(),
    seatReleased: false
  };

  const submitButton = form.querySelector(
    "button[type='submit']"
  );

  submitButton.disabled = true;
  submitButton.textContent = "Registering...";

  try {
    registrations.push(registration);

    localStorage.setItem(
      "registrations",
      JSON.stringify(registrations)
    );

    const seatCounts = JSON.parse(
      localStorage.getItem("seatCounts") || "{}"
    );

    seatCounts[classId] = availableSeats - 1;

    localStorage.setItem(
      "seatCounts",
      JSON.stringify(seatCounts)
    );

    localStorage.setItem(
      "latestRegistration",
      JSON.stringify(registration)
    );

    try {
      await window.sendClassNotification({
        to: email,
        firstName: firstName,
        className: selectedClass.name,
        action: "registered",
        classDate: formatDate(selectedClass.date),
        classTime:
          `${selectedClass.startTime}–` +
          `${selectedClass.endTime}`,
        classLocation:
          selectedClass.location || "Online"
      });
    } catch (emailError) {
      console.error(
        "Registration email failed:",
        emailError
      );
    }

    window.location.href = "RegisteredPage.html";
  } catch (error) {
    showError(
      "Registration could not be saved. Please try again."
    );

    submitButton.disabled = false;
    submitButton.textContent = "Confirm Registration";

    console.error("Registration error:", error);
  }
});

displayClass();