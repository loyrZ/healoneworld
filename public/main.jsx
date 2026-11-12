import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import ClerkCallback from "./components/Login/ClerkCallback.jsx";
import Login from "./components/Login/Login.jsx";
import AccountDashboard from "./components/Account/AccountDashboard.jsx";
import AccountSettings from "./components/Account/AccountSettings.jsx";
import ViewUsers from "./admin/viewusers/ViewUsers.jsx";
import Dashboard from "./admin/dashboard/Dashboard.jsx";
import Announcements from "./admin/announcements/admin-announcements.jsx";
import PublicAnnouncements from "./PublicAnnouncements/public_announcements.jsx";
import Signup from "./components/Login/Signup.jsx";
import ApplicationAccountGate from "./components/Account/ApplicationAccountGate.jsx";
import EmailVerification from "./components/Account/EmailVerification.jsx";
import VolunteerDashboard from "./components/Volunteer/VolunteerDashboard.jsx";
import VolunteerProfile from "./components/Volunteer/VolunteerProfile.jsx";
import ClassesSignIn from "./components/Classes/ClassesSignIn.jsx";
import UserClasses from "./components/Classes/UserClasses.jsx";

import "./css/theme.css";
import "./css/layout.css";

const pages = {
    "/login": Login,
    "/sign-in": Login,
    "/sign-in/sso-callback": ClerkCallback,
    "/sso-callback": ClerkCallback,
    "/account": AccountDashboard,
    "/account/settings": AccountSettings,
    "/admin/viewusers": ViewUsers,
    "/admin/dashboard": Dashboard,
    "/admin/announcements": Announcements,
    "/PublicAnnouncements": PublicAnnouncements,
    "/sign-up": Signup,
    "/verify-email": EmailVerification,
    "/volunteer": VolunteerDashboard,
    "/volunteer/profile": VolunteerProfile,
    "/classes/sign-in": ClassesSignIn,
    "/user-classes": UserClasses,
};

function NotFound() {
    return <p>Page not found.</p>;
}

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const Page =
    pages[path] ||
    (path.startsWith("/sign-in/") ? Login :
     path.startsWith("/sign-up/") ? Signup :
     NotFound);
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")).render(
    <StrictMode>
        {publishableKey ? (
            <ClerkProvider publishableKey={publishableKey}>
                {path === "/account" || path === "/account/settings" ? (
                    <ApplicationAccountGate>
                        <Page />
                    </ApplicationAccountGate>
                ) : (
                    <Page />
                )}
            </ClerkProvider>
        ) : (
            <p>VITE_CLERK_PUBLISHABLE_KEY is missing from .env</p>
        )}
    </StrictMode>
);