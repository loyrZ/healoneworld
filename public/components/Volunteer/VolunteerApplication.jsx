import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";

// Keep these imports if this file is placed in public/components/Volunteer.
// Adjust ../ paths if your component is stored in a different folder.
import "../../css/layout.css";
import "../../css/theme.css";
import "../../css/components.css";
import "../../css/header.css";
import "./VolunteerApplication.css";

const initialForm = {
    phone: "",
    opportunity: "",
    availability: "",
    interests_skills: "",
    reason: ""
};

export default function VolunteerApplication() {
    const { isLoaded, isSignedIn } = useAuth();
    const [account, setAccount] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [verifiedEmail, setVerifiedEmail] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Keep the same request ID if a request is retried. The backend uses it
    // to prevent repeated clicks or network retries from creating duplicates.
    const [requestId] = useState(() => {
        if (window.crypto?.randomUUID) {
            return window.crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    });

    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        if (!isSignedIn) {
            setError("Please sign in before submitting a volunteer application.");
            setLoading(false);
            return;
        }

        async function loadApplicationState() {
            try {
                const response = await fetch(
                    "/api/volunteer/application/me",
                    {
                        credentials: "include"
                    }
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Unable to load your application status."
                    );
                }

                setAccount(data.user || null);
                setVerifiedEmail(Boolean(data.verifiedEmail));
                const application = data.application || null;

                setApplicationStatus(application?.status || null);

                if (application) {
                    setForm({
                        phone: application.phone || "",
                        opportunity: application.opportunity || "",
                        availability: application.availability || "",
                        interests_skills: application.interests_skills || "",
                        reason: application.reason || ""
                    });
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadApplicationState();
    }, [isLoaded, isSignedIn]);

    function updateField(event) {
        const { name, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value
        }));
    }

    async function submitApplication(event) {
        event.preventDefault();
        setMessage("");
        setError("");

        if (!isSignedIn || !account) {
            setError("Please sign in before submitting a volunteer application.");
            return;
        }

        if (!verifiedEmail) {
            setError("Please verify your email address before applying.");
            return;
        }

        if (applicationStatus === "pending_review") {
            setError("Your volunteer application is already awaiting review.");
            return;
        }

        const requiredFields = [
            ["phone", "phone number"],
            ["opportunity", "opportunity of interest"],
            ["availability", "availability"],
            ["interests_skills", "interests or skills"],
            ["reason", "reason for applying"]
        ];

        const missingFields = requiredFields
            .filter(([field]) => !form[field].trim())
            .map(([, label]) => label);

        if (missingFields.length > 0) {
            setError(`Please complete: ${missingFields.join(", ")}.`);
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch("/api/volunteer/application", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...form,
                    request_id: requestId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to submit your application."
                );
            }

            setApplicationStatus("pending_review");
            setMessage(
                data.message ||
                    "Your volunteer application was received and is awaiting review."
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    const isPending = applicationStatus === "pending_review";
    const formDisabled =
        loading ||
        submitting ||
        !isSignedIn ||
        !verifiedEmail ||
        isPending;

    if (!isLoaded || loading) {
        return (
            <main className="volunteer-page">
                <p className="content-status">Loading volunteer application...</p>
            </main>
        );
    }

    return (
        <main className="volunteer-page">
            <header className="site-header">
                <nav className="site-nav container" aria-label="Main navigation">
                    <a className="site-brand" href="/" aria-label="Heal One World home">
                        <img
                            src="/images/logo.png"
                            alt="Heal One World logo"
                        />
                    </a>

                    <ul className="nav-links">
                        <li><a href="/classes.html">Classes</a></li>
                        <li><a href="/programs.html">Programs</a></li>
                        <li>
                            <a href="/volunteer" aria-current="page">
                                Volunteer
                            </a>
                        </li>
                        <li><a href="/rent-space.html">Rent Our Space</a></li>
                        <li><a href="/about.html">About</a></li>
                        <li><a href="/blog.html">Blog</a></li>
                        <li>
                            <a href="/account" className="account-link">
                                {account?.name || "Sign In"}
                            </a>
                        </li>
                        <li>
                            <a className="button button--primary" href="/donate">
                                Donate
                            </a>
                        </li>
                    </ul>
                </nav>
            </header>

            <section className="volunteer-hero">
                <div className="container">
                    <p className="section-eyebrow">Volunteer</p>
                    <h1>Share your time and skills.</h1>
                    <p>
                        Help with classes, workshops, events, internships, and
                        community wellness programs.
                    </p>
                </div>
            </section>

            <section className="volunteer-form-section container">
                <form
                    className={
                        isPending
                            ? "volunteer-form volunteer-form--disabled"
                            : "volunteer-form"
                    }
                    onSubmit={submitApplication}
                    noValidate
                >
                    {isPending && (
                        <div className="application-review-message" role="status">
                            <strong>Application awaiting review</strong>
                            <p>
                                You already submitted a volunteer application.
                                Heal One World administrators will review it.
                            </p>
                        </div>
                    )}

                    {!isSignedIn && (
                        <p className="form-error" role="alert">
                            Please sign in before submitting a volunteer application.
                        </p>
                    )}

                    {account && !verifiedEmail && (
                        <div className="application-review-message" role="alert">
                            <strong>Email verification required</strong>
                            <p>
                                Please verify your primary email address before
                                submitting a volunteer application.
                            </p>
                        </div>
                    )}

                    <div className="form-field">
                        <label htmlFor="applicant-name">Full name</label>
                        <input
                            id="applicant-name"
                            type="text"
                            value={account?.name || ""}
                            readOnly
                            disabled
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="applicant-email">Email address</label>
                        <input
                            id="applicant-email"
                            type="email"
                            value={account?.email || ""}
                            readOnly
                            disabled
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="phone">
                            Phone number <span aria-hidden="true">*</span>
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            value={form.phone}
                            onChange={updateField}
                            disabled={formDisabled}
                            aria-describedby="phone-help"
                        />
                        <small id="phone-help">
                            Include a number where administrators can reach you.
                        </small>
                    </div>

                    <div className="form-field">
                        <label htmlFor="opportunity">
                            How would you like to help? <span aria-hidden="true">*</span>
                        </label>
                        <input
                            id="opportunity"
                            name="opportunity"
                            type="text"
                            required
                            placeholder="Classes, workshops, events, or other opportunity"
                            value={form.opportunity}
                            onChange={updateField}
                            disabled={formDisabled}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="availability">
                            Availability <span aria-hidden="true">*</span>
                        </label>
                        <textarea
                            id="availability"
                            name="availability"
                            required
                            rows="3"
                            placeholder="Tell us when you are generally available."
                            value={form.availability}
                            onChange={updateField}
                            disabled={formDisabled}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="interests_skills">
                            Interests or skills <span aria-hidden="true">*</span>
                        </label>
                        <textarea
                            id="interests_skills"
                            name="interests_skills"
                            required
                            rows="4"
                            placeholder="Tell us about your interests, experience, or skills."
                            value={form.interests_skills}
                            onChange={updateField}
                            disabled={formDisabled}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="reason">
                            Why are you interested in volunteering? <span aria-hidden="true">*</span>
                        </label>
                        <textarea
                            id="reason"
                            name="reason"
                            required
                            rows="5"
                            placeholder="Tell us why you would like to volunteer with Heal One World."
                            value={form.reason}
                            onChange={updateField}
                            disabled={formDisabled}
                        />
                    </div>

                    {message && (
                        <p className="form-success" role="status">
                            {message}
                        </p>
                    )}

                    {error && (
                        <p className="form-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="button button--primary"
                        disabled={formDisabled}
                    >
                        {submitting ? "Submitting..." : "Submit application"}
                    </button>
                </form>
            </section>
        </main>
    );
}
