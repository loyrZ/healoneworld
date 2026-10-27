import { useEffect } from "react";
import { useAuth, useClerk, useUser } from "@clerk/react";
import "./AccountDashboard.css";

function LoadingState() {
    return (
        <main className="account-page">
            <p role="status">Loading your account...</p>
        </main>
    );
}

export default function AccountDashboard() {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const { signOut } = useClerk();

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

    async function handleSignOut() {
        await signOut();
        window.location.assign("/");
    }

    const name =
        user.fullName ||
        user.firstName ||
        user.primaryEmailAddress?.emailAddress ||
        "Member";

    const email = user.primaryEmailAddress?.emailAddress || "";

    return (
        <div className="account-page">
            <header className="account-header">
                <a className="account-header__brand" href="/">
                    Heal One World
                </a>

                <button
                    type="button"
                    className="account-header__sign-out"
                    onClick={handleSignOut}
                >
                    Sign out
                </button>
            </header>

            <div className="account-layout">
                <aside className="account-sidebar">
                    <p className="account-sidebar__eyebrow">My account</p>

                    <nav aria-label="Account navigation">
                        <a
                            href="/account"
                            aria-current="page"
                            className="account-sidebar__link"
                        >
                            Dashboard
                        </a>

                        <a
                            href="/account/settings"
                            className="account-sidebar__link"
                        >
                            Account settings
                        </a>

                        <span className="account-sidebar__link account-sidebar__link--disabled">
                            Registration history
                            <small>Coming soon</small>
                        </span>

                        <span className="account-sidebar__link account-sidebar__link--disabled">
                            Donation history
                            <small>Coming soon</small>
                        </span>
                    </nav>
                </aside>

                <main className="account-content">
                    <section className="account-welcome">
                        <p className="account-content__eyebrow">Dashboard</p>
                        <h1>Welcome, {name}</h1>
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
                            <h2 id="identity-heading">{name}</h2>
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
                        <p className="account-content__eyebrow">Activity</p>
                        <h2 id="activity-heading">Your activity</h2>
                        <p>
                            Registration and donation activity will appear here
                            when those features are available.
                        </p>
                    </section>
                </main>
            </div>
        </div>
    );
}