import {useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import VolunteerLayout from "./VolunteerLayout.jsx";
import "./Volunteer.css";
import "../../css/theme.css";
import "../../css/layout.css";

const EMPTY = { phone: "", interests: "", availability: ""};

export default function VolunteerProfile() {
    const {isLoaded, isSignedIn} = useAuth();
    const [access, setAccess] = useState("loading"); 
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState({type: "", text: ""});
    const [saving, setSaving] = useState(false);

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
            .catch(() => setAccess("error"));
    }, [isLoaded, isSignedIn]);

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
        return <p className="vol-message" role="alert">You don't have approved volunteer access to this page.</p>;
    if (access === "error")
        return <p className="vol-message" role="alert">Your profile could not be loaded. Please try again.</p>;

    return (
        <VolunteerLayout tone="grey">
        <h1>Settings</h1>
        <p className="vol-subtitle">Manage your volunteer profile.</p>

        <section className="vol-card" aria-labelledby="profile-heading">
            <h2 id="profile-heading">Profile</h2>
            <p className="vol-card-desc">
                This information is used by Heal One World staff to contact you about volunteer opportunities.
            </p>

            <form onSubmit={handleSubmit} noValidate className="vol-form">
                {/* the three .vol-field blocks stay exactly as they are */}

                <button type="submit" className="vol-button" disabled={saving}>
                    {saving ? "Saving…" : "Save profile"}
                </button>

                <p role="status" className={message.type === "error" ? "vol-error" : "vol-success"}>
                    {message.text}
                </p>
            </form>
        </section>

        <section className="vol-card" aria-labelledby="account-heading">
            <h2 id="account-heading">Name and email</h2>
            <p className="vol-card-desc">
                Your name and email are managed in your{" "}
                <a href="/account/settings">account settings</a>.
            </p>
        </section>
    </VolunteerLayout>
    );
}