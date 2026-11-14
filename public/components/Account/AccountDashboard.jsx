import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/react";
import AccountMenu from "../AccountMenu/AccountMenu.jsx";
import "./AccountDashboard.css";

function LoadingState() {
    return (
        <main className="account-page">
            <p role="status">Loading your dashboard...</p>
        </main>
    );
}

export default function AccountDashboard() {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            window.location.replace("/sign-in");
        }
    }, [isLoaded, isSignedIn]);

    if (!isLoaded) {
        return <LoadingState />;
    }

    if (!isSignedIn || !user) {
        return null;
    }

    const displayName =
        user.fullName ||
        user.firstName ||
        user.primaryEmailAddress?.emailAddress ||
        "Member";

    const email =
        user.primaryEmailAddress?.emailAddress || "No email address available";

    return (
        <div className="account-page">
            <a className="skip-link" href="#main-content">
                Skip to main content
            </a>
            <header className="account-header">
                <a className="account-header__brand" href="/">
                    Heal One World
                </a>

                <AccountMenu />
            </header>

            <div className="account-layout">
                <aside className="account-sidebar">
                    <p className="account-sidebar__eyebrow">My account</p>

                    <nav aria-label="Account navigation">
                        <a
                            href="/account"
                            className="account-sidebar__link"
                            aria-current="page"
                        >
                            Dashboard
                        </a>

                        <a
                            href="/account/settings"
                            className="account-sidebar__link"
                        >
                            Account settings
                        </a>

                        <div
                            className="account-sidebar__link account-sidebar__link--disabled"
                            aria-disabled="true"
                        >
                            <span>Registration history</span>
                            <small>Unavailable</small>
                        </div>

                        <div
                            className="account-sidebar__link account-sidebar__link--disabled"
                            aria-disabled="true"
                        >
                            <span>Donation history</span>
                            <small>Unavailable</small>
                        </div>
                    </nav>
                </aside>

                <main className="account-content" id="main-content" tabIndex={-1}>
                    <section className="account-welcome">
                        <p className="account-content__eyebrow">
                            Standard user dashboard
                        </p>

                        <h1>Welcome, {displayName}</h1>

                        <p>
                            Manage your Heal One World account and participation.
                        </p>
                    </section>

                    <section
                        className="account-identity"
                        aria-labelledby="identity-heading"
                    >
                        <div>
                            <p className="account-content__eyebrow">
                                Signed-in identity
                            </p>

                            <h2 id="identity-heading">{displayName}</h2>
                            <p>{email}</p>
                        </div>

                        <a
                            className="account-button"
                            href="/account/settings"
                        >
                            Account settings
                        </a>
                    </section>

                    <section
                        className="account-empty-state"
                        aria-labelledby="activity-heading"
                    >
                        <p className="account-content__eyebrow">
                            Participation
                        </p>

                        <h2 id="activity-heading">
                            Your activity will appear here
                        </h2>

                        <p>
                            Registration history and donation history are not
                            available yet.
                        </p>
                    </section>
                </main>
            </div>
        </div>
    );
}
