/* HOW-113: Edit an existing class. Layout from the Figma "Mock Up Prototype" file, frame "Admin / Add or Edit Class". */
//  Claude Revised 

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import "../../css/layout.css";
import "../../css/theme.css";
import "../../css/components.css";
import AdminLayout from "../AdminLayout.jsx";
import ClassFormFields from "./ClassForm.jsx";
import { STATUS_LABELS, registrationLabel, toFormValues } from "./classData.mjs";
import "./ClassEdit.css";

// Shown at /admin/classes/:id/edit (see public/main.jsx).
// Loads and saves through /api/classes/admin/:id (routes/classes.js).

const LOAD_ERRORS = {
    401: "Please sign in with an administrator account to edit classes.",
    403: "You don't have permission to edit classes.",
    404: "This class could not be found. It may have been removed.",
};

function capacityWarning({ registrationCount, capacity }) {
    if (registrationCount === null || registrationCount === undefined) {
        return `Registration counts aren't available, so we can't check whether the new capacity of ${capacity} fits everyone who has already registered.`;
    }
    return `${registrationCount} people are registered, but the new capacity is ${capacity}. Existing registrations will not be cancelled.`;
}

function ClassEdit({ classId }) {
    const { isLoaded, isSignedIn } = useAuth();
    const [load, setLoad] = useState({ status: "loading", error: null });
    const [attempt, setAttempt] = useState(0);
    const [record, setRecord] = useState(null);
    const [form, setForm] = useState(null);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState({ type: "", text: "" });
    const [saving, setSaving] = useState(false);
    const [capacityPrompt, setCapacityPrompt] = useState(null);
    const promptHeading = useRef(null);

    // Load the selected class when the page opens and on retry.
    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            setLoad({ status: "error", error: { status: 401, message: LOAD_ERRORS[401] } });
            return;
        }

        let cancelled = false;
        setLoad({ status: "loading", error: null });

        fetch(`/api/classes/admin/${classId}`, { headers: { Accept: "application/json" } })
            .then(async (res) => {
                if (!res.ok) {
                    const error = new Error(LOAD_ERRORS[res.status] ?? "This class could not be loaded.");
                    error.status = res.status;
                    throw error;
                }
                return res.json();
            })
            .then((data) => {
                if (cancelled) return;
                setRecord(data);
                setForm(toFormValues(data));
                setLoad({ status: "ready", error: null });
            })
            .catch((err) => {
                if (cancelled) return;
                // Never fill the form with another class or example data.
                setRecord(null);
                setForm(null);
                setLoad({
                    status: "error",
                    error: {
                        status: err.status,
                        message: err.status ? err.message : "Could not reach the server. Check your connection.",
                    },
                });
            });

        return () => {
            cancelled = true;
        };
    }, [isLoaded, isSignedIn, classId, attempt]);

    // Move focus to the capacity warning so keyboard and screen reader users notice it.
    useEffect(() => {
        if (capacityPrompt) promptHeading.current?.focus();
    }, [capacityPrompt]);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        if (name === "capacity") setCapacityPrompt(null);
    }

    async function save(confirmCapacityReduction) {
        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch(`/api/classes/admin/${classId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ ...form, confirmCapacityReduction }),
            });
            const body = await res.json().catch(() => ({}));

            if (res.ok) {
                setRecord(body);
                setForm(toFormValues(body));
                setErrors({});
                setCapacityPrompt(null);
                setMessage({ type: "success", text: "Class saved." });
            } else if (res.status === 409 && body.code === "capacity_confirmation_required") {
                setErrors({});
                setCapacityPrompt({ registrationCount: body.registrationCount, capacity: body.capacity });
            } else if (res.status === 400) {
                setErrors(body.errors ?? {});
                setCapacityPrompt(null);
                setMessage({ type: "error", text: body.error ?? "Please fix the highlighted fields. Nothing was saved." });
            } else {
                setCapacityPrompt(null);
                setMessage({
                    type: "error",
                    text: LOAD_ERRORS[res.status] ?? "Your changes could not be saved. Please try again.",
                });
            }
        } catch {
            setMessage({ type: "error", text: "Could not reach the server. Your changes were not saved." });
        } finally {
            setSaving(false);
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        save(false);
    }

    if (load.status === "loading") {
        return (
            <AdminLayout>
                <h1>Edit class</h1>
                <p role="status">Loading class…</p>
            </AdminLayout>
        );
    }

    if (load.status === "error") {
        const canRetry = ![401, 403, 404].includes(load.error.status);

        return (
            <AdminLayout>
                <h1>Edit class</h1>
                <div role="alert" className="class-edit__alert class-edit__alert--error">
                    <p>{load.error.message}</p>
                    <div className="class-edit__actions">
                        {load.error.status === 401 && <a className="class-edit__button" href="/sign-in">Sign in</a>}
                        {canRetry && (
                            <button type="button" className="class-edit__button" onClick={() => setAttempt((count) => count + 1)}>
                                Try again
                            </button>
                        )}
                        <a className="class-edit__link" href="/admin/classes">Back to classes</a>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <p className="class-edit__back"><a href="/admin/classes">← Back to classes</a></p>
            <h1>Edit class</h1>
            <p className="admin-subtitle">Manage the information shown to visitors and registered attendees.</p>

            <dl className="class-edit__summary">
                <div>
                    <dt>Status</dt>
                    <dd>{STATUS_LABELS[record.status] ?? record.status}</dd>
                </div>
                <div>
                    <dt>Registrations</dt>
                    <dd>{registrationLabel(record)}</dd>
                </div>
            </dl>

            <form className="class-edit__form" onSubmit={handleSubmit} noValidate>
                <ClassFormFields form={form} errors={errors} onChange={handleChange} />

                {capacityPrompt && (
                    <div className="class-edit__alert class-edit__alert--warning" role="alert" aria-labelledby="capacity-heading">
                        <h2 id="capacity-heading" ref={promptHeading} tabIndex={-1}>Lower the capacity?</h2>
                        <p>{capacityWarning(capacityPrompt)}</p>
                        <div className="class-edit__actions">
                            <button type="button" className="class-edit__button" disabled={saving} onClick={() => save(true)}>
                                Lower capacity and save
                            </button>
                            <button type="button" className="class-edit__button class-edit__button--secondary" onClick={() => setCapacityPrompt(null)}>
                                Keep editing
                            </button>
                        </div>
                    </div>
                )}

                <div className="class-edit__actions">
                    <button type="submit" className="class-edit__button" disabled={saving}>
                        {saving ? "Saving…" : "Save class"}
                    </button>
                    <a className="class-edit__link" href="/admin/classes">Cancel</a>
                </div>
                <p role="status" className={message.type === "error" ? "class-edit__error" : "class-edit__success"}>
                    {message.text}
                </p>
            </form>
        </AdminLayout>
    );
}

export default ClassEdit;
