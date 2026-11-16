const registerButton = document.querySelector(".register-button");
if (registerButton) {
  registerButton.addEventListener("click", (event) => {
    event.preventDefault();
    const classId = Number(new URLSearchParams(window.location.search).get("id"));
    const selectedClass = classes.find((classItem) => classItem.id === classId);
    if (!selectedClass) {
      alert("Class information could not be found.");
      return;
    }
    const registrationUrl = new URL("../Register For Classes Page/RegisterForClass.html",window.location.href);
    registrationUrl.searchParams.set("id", classId);
    window.location.href = registrationUrl.href;
  });
}
