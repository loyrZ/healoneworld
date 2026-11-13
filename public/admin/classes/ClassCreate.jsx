/* HOW-139: Create a scheduled class or event. Layout from the Figma "Mock Up Prototype" file, frame "Admin / Add or Edit Class". */
//  Claude Revised 

import { useState } from "react";
import { useAuth } from "@clerk/react";
import "../../css/layout.css";
import "../../css/theme.css";
import "../../css/components.css";
import AdminLayout from "../AdminLayout.jsx";
import ClassFormFields from "./ClassForm.jsx";
import { toFormValues } from "./classData.mjs";
import "./ClassEdit.css";

// Shown at /admin/classes/new (see public/main.jsx).
// Saves through POST /api/classes/admin (routes/classes.js), then returns to the list.

const SAVE_ERRORS = {
    401: "Please sign in with an administrator account to create classes.",
    403: "You don't have permission to create classes.",
};

function ClassCreate() {
    const { isLoaded, isSignedIn } = useAuth();
    const [form, setForm] = useState(() => toFormValues({}));
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (saving) return;

        setSaving(true);
        setMessage("");

        try {
            const res = await fetch("/api/classes/admin", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(form),
            });
            const body = await res.json().catch(() => ({}));

            if (res.status === 201 && body.id) {
                // Stay in the saving state so the form can't be submitted twice while leaving.
                window.location.assign(`/admin/classes?created=${body.id}`);
                return;
            }

            if (res.status === 400) {
                setErrors(body.errors ?? {});
                setMessage(body.error ?? "Please fix the highlighted fields. Nothing was saved.");
            } else {
                setMessage(SAVE_ERRORS[res.status] ?? "The class could not be created. Please try again.");
            }
        } catch {
            setMessage("Could not reach the server. The class was not created.");
        }

        setSaving(false);
    }

    if (!isLoaded) {
        return (
            <AdminLayout>
                <h1>Create class</h1>
                <p role="status">Loading…</p>
            </AdminLayout>
        );
    }

    if (!isSignedIn) {
        return (
            <AdminLayout>
                <h1>Create class</h1>
                <div role="alert" className="class-edit__alert class-edit__alert--error">
                    <p>{SAVE_ERRORS[401]}</p>
                    <div className="class-edit__actions">
                        <a className="class-edit__button" href="/sign-in">Sign in</a>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <p className="class-edit__back"><a href="/admin/classes">← Back to classes</a></p>
            <h1>Create class</h1>
            <p className="admin-subtitle">
                Schedule a class or event. It is published to the public calendar when you save.
            </p>

            <form className="class-edit__form" onSubmit={handleSubmit} noValidate>
                <ClassFormFields form={form} errors={errors} onChange={handleChange} />

                <div className="class-edit__actions">
                    <button type="submit" className="class-edit__button" disabled={saving}>
                        {saving ? "Saving…" : "Save class"}
                    </button>
                    <a className="class-edit__link" href="/admin/classes">Cancel</a>
                </div>
                <p role="status" className="class-edit__error">{message}</p>
            </form>
        </AdminLayout>
    );
}

export default ClassCreate;
