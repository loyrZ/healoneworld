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


export default function VolunteerLayout({ children, tone }) {
    const { signOut } = useClerk();
    const { user } = useUser();
    const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

    async function handleSignOut() {
        await signOut();
        window.location.assign("/");
    }

    return (
        <div className="vol-layout">
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
                    <strong>{user?.fullName || "Volunteer"}</strong>
                    {user?.primaryEmailAddress?.emailAddress}
                </div>
                <button type="button" className="vol-sidebar__logout" onClick={handleSignOut}>
                    Log out
                </button>
            </aside>

            <main className={"vol-main" + (tone === "grey" ? " vol-main--grey" : "")}>
                {children}
            </main>
        </div>
    );
}