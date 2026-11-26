const form = document.querySelector("#registration-form");
const errorMessage = document.querySelector("#form-error");
const classLink = document.querySelector("#class-link");

form.noValidate = true;

const classId = new URLSearchParams(window.location.search).get("id");
let selectedClass = null;

classLink.addEventListener("click", (event) => {
  event.preventDefault();

  fetch("/api/account", {
    headers: {
      Accept: "application/json"
    }
  })
    .then(async (response) => {
      if (response.status === 401) {
        return null;
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Sign-in status could not be checked.");
      }

      if (!result.user || typeof result.user.email !== "string") {
        throw new Error("Your signed-in account could not be verified.");
      }

      return result.user;
    })
    .then((account) => {
      if (!account) {
        window.location.href = new URL("SignInPage.html", window.location.href).href;
        return;
      }

      window.location.href = new URL("User's Classes.html", window.location.href).href;
    })
    .catch((error) => {
      console.error("Sign-in status could not be checked:", error);
      showError("Sign-in status could not be checked. Please try again.");
    });
});

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

function getAvailableSeats() {
  return selectedClass.availableSeats;
}

async function loadClass() {
  if (!/^[1-9]\d{0,9}$/.test(classId || "")) {
    showError("Class information could not be found.");
    return;
  }

  try {
    selectedClass = await window.ClassSchedule.loadClass(classId);
  } catch (error) {
    console.error("Class details could not be loaded:", error);
    showError("Class details could not be loaded. Please try again later.");
    return;
  }

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

  const submitButton = form.querySelector(
    "button[type='submit']"
  );
  submitButton.disabled = true;
  const availableSeats = getAvailableSeats();

  if (availableSeats !== null && availableSeats <= 0) {
    showError("This class is currently full.");
    submitButton.disabled = false;
    submitButton.textContent = "Confirm Registration";
    return;
  }

  submitButton.textContent = "Registering...";

  try {
    const response = await fetch(`/api/class-registrations/class/${classId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ phone: phoneDigits, accessibilityNotes: accessibility })
    });
    const savedRegistration = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(savedRegistration.error || "Registration could not be saved. Please try again.");
    }

    let emailNotificationStatus = "pending";
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
      emailNotificationStatus = "sent";
    } catch (emailError) {
      emailNotificationStatus = "failed";
      console.error(
        "Registration email failed:",
        emailError
      );
    }

    const confirmationUrl = new URL("/register/RegisteredPage.html", window.location.origin);
    confirmationUrl.searchParams.set("registration", savedRegistration.id);
    confirmationUrl.searchParams.set("emailStatus", emailNotificationStatus);
    window.location.href = confirmationUrl.href;
  } catch (error) {
    showError(
      error.message || "Registration could not be saved. Please try again."
    );

    submitButton.disabled = false;
    submitButton.textContent = "Confirm Registration";

    console.error("Registration error:", error);
  }
});

loadClass();
