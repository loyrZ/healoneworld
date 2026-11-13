import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AccountMenu from "../AccountMenu/AccountMenu.jsx";
import { initializeHeaderMenu } from "../../js/header-menu.js";

import "../../css/theme.css";
import "../../css/layout.css";
import "../../css/components.css";
import "../../css/header.css";

export default function PublicHeader() {
    const containerRef = useRef(null);
    const [accountSlot, setAccountSlot] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        let cleanupMenu = () => {};

        async function loadHeader() {
            try {
                const response = await fetch("/components/header.html", {
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error("Could not load the header.");
                }

                const markup = await response.text();

                if (controller.signal.aborted) return;

                const container = containerRef.current;
                if (!container) return;

                // Load our shared HTML template.
                container.innerHTML = markup;

                const slot = container.querySelector("[data-account-slot]");

                if (slot) {
                    slot.replaceChildren();
                    setAccountSlot(slot);
                }

                cleanupMenu = initializeHeaderMenu(container);
            } catch (error) {
                if (controller.signal.aborted) return;

                console.error(error);

                if (containerRef.current) {
                    containerRef.current.textContent =
                        "Navigation could not load. Please refresh.";
                }
            }
        }

        loadHeader();

        return () => {
            controller.abort();
            cleanupMenu();
        };
    }, []);

    return (
        <>
            <div ref={containerRef}>
                <p role="status">Loading navigation...</p>
            </div>

            {accountSlot && createPortal(<AccountMenu />, accountSlot)}
        </>
    );
}