import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import "./Volunteer.css";

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
        <main className="vol-page">
            <h1>Volunteer dashboard</h1>
            <p>
                Signed in as <strong>{state.data.name || "Volunteer"}</strong> ({state.data.email})
            </p>
            <nav aria-label="Volunteer">
                <a className="vol-link" href="/volunteer/profile">My profile</a>
            </nav>

            <section aria-labelledby="classes-heading">
                <h2 id="classes-heading">My classes</h2>
                <p>Class proposals and hosted-class history are coming soon.</p>
            </section>
            <section aria-labelledby="activities-heading">
                <h2 id="activities-heading">My activities</h2>
                <p>Nothing here yet.</p>
            </section>
        </main>
    );
}   