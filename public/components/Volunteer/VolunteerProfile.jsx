import {useEffect, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/react";
import "../../css/theme.css";
import "./Volunteer.css";
import "./VolunteerProfile.css";
import VolunteerLayout from "./VolunteerLayout.jsx";

const EMPTY = { phone: "", interests: "", availability: ""};

export default function VolunteerProfile() {
    const {isLoaded, isSignedIn} = useAuth();
    const {user} = useUser();
    const {signOut} = useClerk();
    const [access, setAccess] = useState("loading");
    const [attempt, setAttempt] = useState(0); 
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState({type: "", text: ""});
    const [saving, setSaving] = useState(false);

    // load saved profile when page opens and on retry
    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn){
            window.location.assign("/login");
            this.return;
        }
        fetch("/api/volunteer/profile", {headers: {Accept: "application/json"}})
            .then(async(res)=> {
                if (res.status === 403) return setAccess("denied");
                if (!res.ok) return setAccess("error");
                setForm({ ...EMPTY, ...(await res.json())});
                setAccess("ok");
            })
            .catch((err) => {
                console.error("profile load failed:", err)
                setAccess("error");
            });
    }, [isLoaded, isSignedIn, attempt]);

    // Don't leave the page loading indefinitely
    useEffect(() => {
        if (access !== "loading") return;
        const timer = setTimeout(() => setAccess("error"), 1000);
        return() => clearTimeout(timer);
    }, [access, attempt]);

    function retry() {
        setAccess("loading");
        setAttempt((n) => n + 1);
    }

    async function handleSignOut(){
        await signOut();
        window.location.assign("/home.html");
    }

    function handleChange(e){
        setForm({ ...form, [e.target.name]: e.target.value});
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: ""});
        try { 
            const res = await fetch("/api/volunteer/profile", {
                method: "PUT",
                headers: {"Content-Type": "application/json", Accept: "application/json"},
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setErrors({});
                setMessage({type: "success", text: "Profile saved."});
            } else if (res.status === 400) {
                const body = await res.json().catch(() => ({}));
                setErrors(body.errors ?? {});
                setMessage({ type: "error", text: "Please fix the highlighted fields. Nothing was saved."});
            } else {
                setMessage({ type: "error", text: "Your changes could not be saved. Please try again."});
            }
        } catch {
            setMessage({ type: "error", text: "Could not reach server. Your changes were not saved."});
        } finally {
            setSaving(false);
        }
    }

    if (access === "loading") return <p className = "vol-message">Loading...</p>;
    if (access === "denied")
        return (
            <div className="vol-message" role="alert">
                <p>You don't have approved volunteer access to this page.</p>
                <p><a href="/home.html">Back to the Heal One World website</a></p>
            </div>
        );

    if (access === "error")
        return (
            <div className="vol-message" role="alert">
                <p>Your profile could not be loaded. Please try again.</p>
                <button type="button" className="vol-button" onClick={retry}>Try again</button>
            </div>
        );

    return (
        <VolunteerLayout tone="grey">
        <h1>Settings</h1>
        <p className="vol-subtitle">Manage your volunteer profile.</p>

        <section className="vol-card" aria-labelledby="profile-heading">
            <h2 id="profile-heading">Profile</h2>
            <p className="vol-card-desc">
                This information is used by Heal One World staff to contact you about volunteer opportunities.
            </p>
            <p className="vol-form-note">All fields are optional.</p>

            <form onSubmit={handleSubmit} noValidate className="vol-form">
                <div className="vol-field">
                        <label htmlFor="fullName">Full name</label>
                        <input
                            id="fullName" type="text" readOnly
                            className="vol-readonly-input"
                            value={user?.fullName || ""}
                            aria-describedby="account-note"
                        />
                    </div>
                    <div className="vol-field">
                        <label htmlFor="email">Email address</label>
                        <input
                            id="email" type="email" readOnly
                            className="vol-readonly-input"
                            value={user?.primaryEmailAddress?.emailAddress || ""}
                            aria-describedby="account-note"
                        />
                        <p id="interests-error" className="vol-error">{errors.interests}</p>
                    </div>
                    <p id="account-note" className="vol-form-note vol-wide">
                        Name and email are managed in your account settings, so they can't be edited here.
                        The fields below are all optional.
                    </p>

                    <div className="vol-field">
                        <label htmlFor="phone">
                            Phone number <span className="vol-optional">(optional)</span>
                        </label>
                        <textarea
                            id="phone" name="phone" type="tel" autoComplete="tel"                            
                            maxLength={20} value={form.phone} onChange={handleChange}
                            aria-invalid={errors.phone ? "true" : "false"}
                            aria-describedby="phone-error"
                        />
                        <p id="phone-error" className="vol-error">{errors.phone}</p>
                    </div>

          <div className="vol-field vol-wide">
                <label htmlFor="interests">
                    Interests or skills <span className="vol-optional">(optional)</span>
                </label>
                <textarea
                    id="interests" name="interests" rows={4}
                    maxLength={500} value={form.interests} onChange={handleChange}
                    aria-invalid={errors.interests ? "true" : "false"}
                    aria-describedby="interests-error"
                />
                <p id="interests-error" className="vol-error">{errors.interests}</p>
            </div>

            <div className="vol-field vol-wide">
                <label htmlFor="availability">
                    Availability <span className="vol-optional">(optional)</span>
                </label>
                <textarea
                    id="availability" name="availability" rows={4}
                    maxLength={500} value={form.availability} onChange={handleChange}
                    aria-invalid={errors.availability ? "true" : "false"}
                    aria-describedby="availability-error"
                />
                <p id="availability-error" className="vol-error">{errors.availability}</p>
            </div>

            <div className="vol-wide">
                <button type="submit" className="vol-button" disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                </button>
                <p role="status" className={message.type === "error" ? "vol-error" : "vol-success"}>
                    {message.text}
                </p>
            </div>
        </form>
    </section>

    <section className="vol-card" aria-labelledby="security-heading">
        <h2 id="security-heading">Account &amp; security</h2>
        <p className="vol-card-desc">Sign out of the volunteer portal.</p>
        <button type="button" className="vol-button vol-button--outline" onClick={handleSignOut}>
            Log out
        </button>
    </section>
</VolunteerLayout>
    );
}