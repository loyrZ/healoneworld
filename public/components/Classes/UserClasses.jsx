import { useEffect } from "react";
import { useAuth, useClerk, useUser } from "@clerk/react";
import "./UserClasses.css";

function getRegistrations(email) {
    const savedRegistrations = localStorage.getItem("registrations");
    if (!savedRegistrations) return [];

    const registrations = JSON.parse(savedRegistrations);
    if (!Array.isArray(registrations)) {
        throw new Error("Saved class registrations are not in a valid format.");
    }

    return registrations.filter(
        (registration) =>
            registration &&
            String(registration.email || "").trim().toLowerCase() ===
                email.toLowerCase() &&
            registration.class
    );
}

function formatClassDate(date) {
    if (!date) return "";

    const parsedDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
}

export default function UserClasses() {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const { signOut } = useClerk();

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            window.location.replace("/classes/sign-in");
        }
    }, [isLoaded, isSignedIn]);

    if (!isLoaded) {
        return <p role="status">Loading your classes…</p>;
    }

    if (!isSignedIn || !user) return null;

    const email = user.primaryEmailAddress?.emailAddress || "";
    let registrations;
    let registrationError = "";

    try {
        registrations = getRegistrations(email);
    } catch (error) {
        registrationError = error.message || "Unable to load your registrations.";
        registrations = [];
    }

    return (
        <main className="user-classes">
            <header className="user-classes__header">
                <a className="user-classes__brand" href="/">
                    Heal One World
                </a>
                <button
                    type="button"
                    onClick={() =>
                        signOut({ redirectUrl: "/classes/sign-in" })
                    }
                >
                    Sign out
                </button>
            </header>

            <section aria-labelledby="classes-heading">
                <h1 id="classes-heading">My classes</h1>
                <p className="user-classes__intro">
                    View your registrations for {email || "your account"}.
                </p>

                {registrationError ? (
                    <p role="alert">{registrationError}</p>
                ) : registrations.length ? (
                    <div className="user-classes__list">
                        {registrations.map((registration, index) => {
                            const classItem = registration.class;
                            return (
                                <article
                                    className="user-classes__card"
                                    key={`${classItem.id || classItem.name}-${index}`}
                                >
                                    <h2>{classItem.name || "Class"}</h2>
                                    <p>
                                        {formatClassDate(classItem.date)}
                                        {classItem.startTime &&
                                            ` · ${classItem.startTime}`}
                                        {classItem.endTime &&
                                            `–${classItem.endTime}`}
                                    </p>
                                    <p>
                                        {classItem.mode || ""}
                                        {classItem.location &&
                                            ` · ${classItem.location}`}
                                    </p>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="user-classes__empty">
                        No class registrations were found for this email
                        address.
                    </p>
                )}
            </section>
        </main>
    );
}
