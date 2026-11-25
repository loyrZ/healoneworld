import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import ClassFormFields from "../../admin/classes/ClassForm.jsx";
import { toFormValues } from "../../admin/classes/classData.mjs";
import "../../admin/classes/ClassEdit.css";
import "./Volunteer.css";
import VolunteerLayout from "./VolunteerLayout.jsx";

const SAVE_ERRORS = {
    401: "Please sign in to submit a class.",
    403: "Instructor access is required to submit a class.",
};

export default function VolunteerClassCreate() {
    const { isLoaded, isSignedIn } = useAuth();
    const [form, setForm] = useState(() => toFormValues({}));
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [access, setAccess] = useState("loading");

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            setAccess("signed-out");
            return;
        }

        let cancelled = false;

        fetch("/api/classes/submissions", { headers: { Accept: "application/json" } })
            .then((response) => {
                if (cancelled) return;
                setAccess(response.ok ? "ready" : response.status === 403 ? "denied" : "error");
            })
            .catch(() => {
                if (!cancelled) setAccess("error");
            });

        return () => {
            cancelled = true;
        };
    }, [isLoaded, isSignedIn]);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (saving) return;

        setSaving(true);
        setErrors({});
        setMessage("");

        const { instructor, ...submission } = form;

        try {
            const response = await fetch("/api/classes/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(submission),
            });
            const body = await response.json().catch(() => ({}));

            if (response.status === 201 && body.id) {
                setForm(toFormValues({}));
                setMessage(
                    "Your class was submitted for staff approval. It will not appear publicly until it is approved."
                );
                return;
            }

            if (response.status === 400) {
                setErrors(body.errors ?? {});
                setMessage(body.error ?? "Please fix the highlighted fields. Nothing was submitted.");
                return;
            }

            setMessage(SAVE_ERRORS[response.status] ?? "The class could not be submitted. Please try again.");
        } catch {
            setMessage("Could not reach the server. The class was not submitted.");
        } finally {
            setSaving(false);
        }
    }

    if (access === "loading") return <p className="vol-message" role="status">Loading…</p>;

    if (access === "signed-out") {
        return <p className="vol-message" role="alert">{SAVE_ERRORS[401]} <a href="/sign-in">Sign in</a></p>;
    }

    if (access === "denied") return <p className="vol-message" role="alert">{SAVE_ERRORS[403]}</p>;

    if (access === "error") {
        return <p className="vol-message" role="alert">The class submission page could not be loaded. Please try again.</p>;
    }

    return (
        <VolunteerLayout>
            <p className="class-edit__back"><a href="/volunteer">← Back to dashboard</a></p>
            <h1>Submit a class</h1>
            <p className="vol-subtitle">
                Submit a scheduled class for staff review. Approved classes appear on the public calendar.
            </p>

            <form className="class-edit__form" onSubmit={handleSubmit} noValidate>
                <ClassFormFields form={form} errors={errors} onChange={handleChange} showInstructor={false} />

                <div className="class-edit__actions">
                    <button type="submit" className="class-edit__button" disabled={saving}>
                        {saving ? "Submitting…" : "Submit for approval"}
                    </button>
                    <a className="class-edit__link" href="/volunteer">Cancel</a>
                </div>

                {message && (
                    <p
                        className={Object.keys(errors).length ? "class-edit__error" : "class-edit__success"}
                        role={Object.keys(errors).length ? "alert" : "status"}
                    >
                        {message}
                    </p>
                )}
            </form>
        </VolunteerLayout>
    );
}