import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import Login from "./components/Login/Login.jsx";
import AccountMenu from "./components/AccountMenu/AccountMenu.jsx";
import ViewUsers from "./admin/viewusers/ViewUsers.jsx";
import Dashboard from "./admin/dashboard/Dashboard.jsx";
import VolunteerDashboard from "./components/Volunteer/VolunteerDashboard.jsx";

// Website pages: the URL path on the left, the component it shows on the right.
// Add new pages here, e.g. "/classes": Classes,
const pages = {
    "/": AccountMenu,
    "/login": Login,
    "/sign-in": Login,
    "/admin/viewusers": ViewUsers,
    "/admin/dashboard": Dashboard,
    "/volunteer": VolunteerDashboard,
};

function NotFound() {
    return <p>Page not found.</p>;
}

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const Page = pages[path] || NotFound;
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
