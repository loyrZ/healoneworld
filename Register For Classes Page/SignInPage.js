const USERS_STORAGE_KEY = "healOneWorldUsers";
const ACTIVE_USER_KEY = "healOneWorldActiveUser";
const form = document.getElementById("sign-in-form");
const errorMessage = document.getElementById("form-error");

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const email = document
    .getElementById("email")
    .value
    .trim()
    .toLowerCase();
  const password = document.getElementById("password").value;
  if (email === "" || password === "") {
    errorMessage.textContent = "Please enter your email and password.";
    return;
  }
  let users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "{}");
  if (users[email] && users[email].password !== password) {
    errorMessage.textContent = "The password entered is incorrect.";
    return;
  }
  if (!users[email]) {
    users[email] = {
      email: email,
      password: password,
      registeredClasses: []
    };
  }
  localStorage.setItem(
    USERS_STORAGE_KEY,
    JSON.stringify(users)
  );
  localStorage.setItem(ACTIVE_USER_KEY, email);

  window.location.href = "./User's Classes.html";
});