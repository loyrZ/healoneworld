import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import VolunteerLayout from "./VolunteerLayout.jsx";
import "../../css/theme.css";
import "../../css/layout.css";

export default function VolunteerDashboard() {
    const { isLoaded, isSignedIn } = useAuth();
    const [state, setState] = useState({status: "loading"});

    useEffect(() => {
        if(!isLoaded) return;
        if (!isSignedIn) {
            window.location.assign("/login");
            return;
        }
        fetch("/api/volunteer/dashboard", {headers: { Accept: "application/json" }})
            .then(async(res) => {
                if (res.status === 403) return setState({status: "denied"});
                if (!res.ok) return setState({status: "error"});
                setState({status: "ok", data: await res.json()});
            })
            .catch(() => setState({status: "error"}));
    }, [isLoaded, isSignedIn]);

    if (state.status === "loading") return <p className="vol-message">Loading...</p>;
    if (state.status === "denied")
        return (
            <p className="vol-message" role="alert">
                You don't have approved-volunteer access to this page.
            </p>
        );
    if (state.status === "error")
        return (
            <p className="vol-message" role="alert">
                Something went wrong. Please try again.
            </p>
        );

    return (
        <VolunteerLayout>
        <h1>Volunteer dashboard</h1>
        <p className="vol-subtitle">
            Manage the classes you host and submit new classes for staff approval.
        </p>
        <p className="vol-notice" role="note">
            Hosting and class submissions are coming soon. These sections will fill in once they're available.
        </p>

        <div className="vol-stats">
            {["Upcoming hosted", "Pending approval", "Classes hosted"].map((label) => (
                <div className="vol-stat" key={label}>
                    <p className="vol-stat-label">{label}</p>
                    <p className="vol-stat-value" aria-label="Not available yet">—</p>
                </div>
            ))}
        </div>

        <section className="vol-section" aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading">Upcoming hosted classes</h2>
            <p className="vol-empty">No hosted classes yet. Class hosting is coming soon.</p>
        </section>

        <section className="vol-section" aria-labelledby="recent-heading">
            <h2 id="recent-heading">Recent submissions</h2>
            <p className="vol-empty">No submissions yet. Class submissions are coming soon.</p>
        </section>

        <button type="button" className="vol-button" disabled>
            Create a class (coming soon)
        </button>
    </VolunteerLayout>
    );
}   