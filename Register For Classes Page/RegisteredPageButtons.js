document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    const buttonText = button.textContent.trim().toLowerCase();
    button.addEventListener("click", () => {
      if (buttonText === "my classes") {
        window.location.href = new URL("User's Classes.html", window.location.href).href;
        return;
      }
      if (buttonText === "browse classes") {
        window.location.href = "/classes/upcoming.html";
      }
    });
  });
});
