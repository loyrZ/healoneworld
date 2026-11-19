const form = document.querySelector("#registration-form");
const errorMessage = document.querySelector("#form-error");
const classLink = document.querySelector("#class-link");

form.noValidate = true;

const classId = new URLSearchParams(window.location.search).get("id");
let selectedClass = null;

classLink.addEventListener("click", (event) => {
  event.preventDefault();

  const enteredEmail = document
    .querySelector("#email")
    .value
    .trim()
    .toLowerCase();
  let latestRegistrationEmail = "";
  try {
    const latestRegistration = JSON.parse(
      localStorage.getItem("latestRegistration") || "null"
    );
    if (typeof latestRegistration?.email === "string") {
      latestRegistrationEmail = latestRegistration.email.trim().toLowerCase();
    }
  } catch (error) {
    console.error("Could not read the latest registration:", error);
  }

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
        const signInUrl = new URL("SignInPage.html", window.location.href);
        const email = enteredEmail || latestRegistrationEmail;
        if (email) {
          signInUrl.searchParams.set("email", email);
        }
        window.location.href = signInUrl.href;
        return;
      }

      const activeUserEmail =
        enteredEmail ||
        latestRegistrationEmail ||
        account.email.trim().toLowerCase();
      localStorage.setItem("healOneWorldActiveUser", activeUserEmail);
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
    selectedClass.capacity
  );
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

  const registrations = getRegistrations();

  const alreadyRegistered = registrations.some(
    (registration) => {
      return (
        registration.class &&
        Number(registration.class.id) === Number(classId) &&
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

  const submitButton = form.querySelector(
    "button[type='submit']"
  );
  submitButton.disabled = true;
  const availableSeats = getAvailableSeats();

  if (availableSeats <= 0) {
    showError("This class is currently full.");
    submitButton.disabled = false;
    submitButton.textContent = "Confirm Registration";
    return;
  }

  const registration = {
    class: selectedClass,
    accountEmail: email,
    firstName: firstName,
    lastName: lastName,
    email: email,
    phone: phoneDigits,
    accessibility: accessibility,
    status: "active",
    registeredAt: new Date().toISOString(),
    seatReleased: false
  };

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

    registration.emailNotificationStatus = "pending";
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
      registration.emailNotificationStatus = "sent";
    } catch (emailError) {
      registration.emailNotificationStatus = "failed";
      console.error(
        "Registration email failed:",
        emailError
      );
    }

    localStorage.setItem(
      "registrations",
      JSON.stringify(registrations)
    );
    localStorage.setItem(
      "latestRegistration",
      JSON.stringify(registration)
    );

    window.location.href = "/register/RegisteredPage.html";
  } catch (error) {
    showError(
      "Registration could not be saved. Please try again."
    );

    submitButton.disabled = false;
    submitButton.textContent = "Confirm Registration";

    console.error("Registration error:", error);
  }
});

loadClass();