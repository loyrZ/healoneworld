const registerButton = document.querySelector(".register-button");
if (registerButton) {
  registerButton.addEventListener("click", (event) => {
    event.preventDefault();
    const classId = new URLSearchParams(window.location.search).get("id");
    if (!/^[1-9]\d{0,9}$/.test(classId || "")) {
      alert("Class information could not be found.");
      return;
    }
    window.location.href =
      `/register/RegisterForClass.html?id=${encodeURIComponent(classId)}`;
  });
}
