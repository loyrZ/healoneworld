export function initializeHeaderMenu(container) {
    const toggle = container.querySelector(".menu-toggle");
    const links = container.querySelector("#main-navigation");

    if (!toggle || !links) return () => {};

    const mobile = window.matchMedia("(max-width: 1199px)");

    function setOpen(open) {
        toggle.setAttribute("aria-expanded", String(open));
        links.hidden = mobile.matches && !open;
    }

    function updateLayout() {
        if (!mobile.matches && document.activeElement === toggle) {
            links.querySelector("a")?.focus();
        }

        toggle.hidden = !mobile.matches;

        if (mobile.matches && links.contains(document.activeElement)) {
            toggle.focus();
        }

        setOpen(false);
    }

    function handleToggle() {
        setOpen(toggle.getAttribute("aria-expanded") !== "true");
    }

    function handleKeydown(event) {
        if (
            event.key === "Escape" &&
            mobile.matches &&
            toggle.getAttribute("aria-expanded") === "true"
        ) {
            setOpen(false);
            toggle.focus();
        }
    }

    function handleLinkClick(event) {
        if (mobile.matches && event.target.closest("a")) {
            setOpen(false);
            toggle.focus();
        }
    }

    toggle.addEventListener("click", handleToggle);
    container.addEventListener("keydown", handleKeydown);
    links.addEventListener("click", handleLinkClick);
    mobile.addEventListener("change", updateLayout);

    updateLayout();

    return function cleanup() {
        toggle.removeEventListener("click", handleToggle);
        container.removeEventListener("keydown", handleKeydown);
        links.removeEventListener("click", handleLinkClick);
        mobile.removeEventListener("change", updateLayout);
    };
}