import { useEffect, useRef } from "react";
import { initializeHeaderMenu } from "../../js/header-menu.js";

import "../../css/theme.css";
import "../../css/layout.css";
import "../../css/components.css";
import "../../css/header.css";

export default function PublicHeader() {
    const containerRef = useRef(null);

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

                // This template comes from our own shared header file.
                container.innerHTML = markup;
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
        <div ref={containerRef}>
            <p role="status">Loading navigation...</p>
        </div>
    );
}