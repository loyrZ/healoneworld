import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import AccountMenu from "./components/AccountMenu/AccountMenu.jsx";

const slot = document.querySelector("[data-account-slot]");
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (slot) {
    if (publishableKey) {
        createRoot(slot).render(
            <ClerkProvider publishableKey={publishableKey}>
                <AccountMenu />
            </ClerkProvider>
        );
    } else {
        slot.textContent = "Account navigation is unavailable.";
    }
}