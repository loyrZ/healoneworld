document.addEventListener("DOMContentLoaded", () => {
  const ACTIVE_USER_KEY = "healOneWorldActiveUser";
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    const buttonText = button.textContent.trim().toLowerCase();
    button.addEventListener("click", () => {
      if (buttonText === "my classes") {
        let registrationEmail = "";
        try {
          const registration = JSON.parse(localStorage.getItem("latestRegistration") || "null");
          if (typeof registration?.email === "string") {
            registrationEmail = registration.email.trim().toLowerCase();
          }
        } catch (error) {
          console.error("Could not read the latest registration:", error);
        }
        if (registrationEmail) {
          localStorage.setItem(ACTIVE_USER_KEY, registrationEmail);
        } else {
          localStorage.removeItem(ACTIVE_USER_KEY);
        }
        window.location.href = new URL("User's Classes.html", window.location.href).href;
        return;
      }
      if (buttonText === "browse classes") {
        window.location.href = new URL("../Upcoming%20Classes%20Practice/Header%20%26%20Section.html",window.location.href).href;
      }
    });
  });
});
