/* Load the shared header and control its mobile menu. */

async function loadHeader() {
  const container = document.querySelector("[data-site-header]");
  if (!container) return;

  try {
    const response = await fetch("/components/header.html");
    if (!response.ok) throw new Error("Could not load the header.");

    container.innerHTML = await response.text();

    const toggle = container.querySelector(".menu-toggle");
    const links = container.querySelector("#main-navigation");
    const mobile = window.matchMedia("(max-width: 1199px)");

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      links.hidden = mobile.matches && !open;
    }

    function updateLayout() {
      if (!mobile.matches && document.activeElement === toggle) {
        links.querySelector("a").focus();
      }

      toggle.hidden = !mobile.matches;

      if (mobile.matches && links.contains(document.activeElement)) {
        toggle.focus();
      }

      setOpen(false);
    }

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    container.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        mobile.matches &&
        toggle.getAttribute("aria-expanded") === "true"
      ) {
        setOpen(false);
        toggle.focus();
      }
    });

    links.addEventListener("click", (event) => {
      if (mobile.matches && event.target.closest("a")) {
        setOpen(false);
        toggle.focus();
      }
    });

    mobile.addEventListener("change", updateLayout);
    updateLayout();
  } catch (error) {
    console.error(error);
    container.textContent = "Navigation could not load. Please refresh.";
  }
}

loadHeader();