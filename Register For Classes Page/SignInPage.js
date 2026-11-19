"use strict";

const ACTIVE_USER_KEY = "healOneWorldActiveUser";
const form = document.getElementById("sign-in-form");
const emailInput = document.getElementById("email");
const errorMessage = document.getElementById("form-error");
const emailFromUrl = new URLSearchParams(window.location.search).get("email");

if (emailFromUrl) {
  emailInput.value = emailFromUrl;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = emailInput.value.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorMessage.textContent = "Please enter a valid email address.";
    return;
  }

  localStorage.setItem(ACTIVE_USER_KEY, email);
  window.location.href = new URL("User's Classes.html", window.location.href).href;
});
