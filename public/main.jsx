import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import ClerkCallback from "./components/Login/ClerkCallback.jsx";
import Login from "./components/Login/Login.jsx";
import AccountDashboard from "./components/Account/AccountDashboard.jsx";
import AccountSettings from "./components/Account/AccountSettings.jsx";
import ViewUsers from "./admin/viewusers/ViewUsers.jsx";
import Dashboard from "./admin/dashboard/Dashboard.jsx";

import "./css/theme.css";
import "./css/layout.css";


// Website pages: the URL path on the left, the component it shows on the right.
// Add new pages here, e.g. "/classes": Classes,
const pages = {
    "/login": Login,
    "/sign-in": Login,
    "/sign-in/sso-callback": ClerkCallback,
    "/sso-callback": ClerkCallback,
    "/account": AccountDashboard,
    "/account/settings": AccountSettings,
    "/admin/viewusers": ViewUsers,
    "/admin/dashboard": Dashboard,
};

function NotFound() {
    return <p>Page not found.</p>;
}

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const Page =
    pages[path] ||
    (path.startsWith("/sign-in/") ? Login : NotFound);
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")).render(
    <StrictMode>
        {publishableKey ? (
            <ClerkProvider publishableKey={publishableKey}>
                <Page />
            </ClerkProvider>
        ) : (
            <p>VITE_CLERK_PUBLISHABLE_KEY is missing from .env</p>
        )}
    </StrictMode>
);
