import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
    AuthenticateWithRedirectCallback,
    ClerkProvider,
} from "@clerk/react";
import Login from "./components/Login/Login.jsx";
import AccountDashboard from "./components/Account/AccountDashboard.jsx";
import AccountSettings from "./components/Account/AccountSettings.jsx";
import ViewUsers from "./admin/viewusers/ViewUsers.jsx";
import Dashboard from "./admin/dashboard/Dashboard.jsx";


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

function ClerkCallback() {
    return (
        <AuthenticateWithRedirectCallback
            signInForceRedirectUrl="/account"
            signUpForceRedirectUrl="/account"
        />
    );
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
