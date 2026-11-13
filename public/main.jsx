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
import ClassList from "./admin/classes/ClassList.jsx";
import ClassEdit from "./admin/classes/ClassEdit.jsx";
import ClassCreate from "./admin/classes/ClassCreate.jsx";
import AboutUs from "./AboutUsPage/AboutUs.jsx";
import PublicHeader from "./components/Header/PublicHeader.jsx";

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
    "/admin/classes": ClassList,
    "/admin/classes/new": ClassCreate,
    "/PublicAnnouncements": PublicAnnouncements,
    "/sign-up": Signup,
    "/verify-email": EmailVerification,
    "/volunteer": VolunteerDashboard,
    "/volunteer/profile": VolunteerProfile,
    "/about": AboutUs,
};

function NotFound() {
    return <p>Page not found.</p>;
}

const path = window.location.pathname.replace(/\/+$/, "") || "/";

// Pages above match exact paths; this one carries the class ID: /admin/classes/12/edit.
const classEditMatch = path.match(/^\/admin\/classes\/(\d+)\/edit$/);
function ClassEditPage() {
    return <ClassEdit classId={classEditMatch[1]} />;
}

const Page =
    pages[path] ||
    (classEditMatch ? ClassEditPage :
     path.startsWith("/sign-in/") ? Login :
     path.startsWith("/sign-up/") ? Signup :
     NotFound);
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const usesPublicHeader = [
    "/about",
    "/PublicAnnouncements"
].includes(path);

createRoot(document.getElementById("root")).render(
    <StrictMode>
        {publishableKey ? (
            <ClerkProvider publishableKey={publishableKey}>
                {usesPublicHeader && <PublicHeader />}
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