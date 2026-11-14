import { useClerk, useUser } from "@clerk/react";
import "../../css/theme.css";
import "../../css/layout.css";
import "./VolunteerLayout.css";

// Links on sidebar for pages that are coming later
const NAV = [
    { label: "Dashboard", href: "/volunteer" },
    { label: "Create a class", soon: true },
    { label: "Upcoming classes", soon: true },
    { label: "Previous classes", soon: true },
    { label: "Settings", href: "/volunteer/profile" },
];


export default function VolunteerLayout({ children, tone, identity }) {
    const { signOut } = useClerk();
    const { user } = useUser();
    const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

    async function handleSignOut() {
        await signOut();
        window.location.assign("/home.html");
    }

    return (
        <div className="vol-layout">
            <a className="skip-link" href="#main-content">
                Skip to main content
            </a>
            <aside className="vol-sidebar">
                <p className="vol-sidebar__brand">Heal One World</p>
                <p className="vol-sidebar__sub">Volunteer portal</p>

                <nav aria-label="Volunteer">
                    <ul className="vol-sidebar__nav">
                        {NAV.map((item) => (
                            <li key={item.label}>
                                {item.soon ? (
                                    <span className="vol-sidebar__soon" aria-disabled="true">
                                        {item.label} <small>(coming soon)</small>
                                    </span>
                                ) : (
                                    <a
                                        href={item.href}
                                        aria-current={currentPath === item.href ? "page" : undefined}
                                    >
                                        {item.label}
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="vol-sidebar__user">
                    <strong>{identity?.name || user?.fullName || "Volunteer"}</strong>
                    {identity?.email || user?.primaryEmailAddress?.emailAddress}
                </div>
                <button type="button" className="vol-sidebar__logout" onClick={handleSignOut}>
                    Log out
                </button>
            </aside>

            <main
                className={"vol-main" + (tone === "grey" ? " vol-main--grey" : "")}
                id="main-content"
                tabIndex={-1}
            >
                {children}
            </main>
        </div>
    );
}