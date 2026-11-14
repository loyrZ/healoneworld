import { useEffect, useState } from "react";
import AdminLayout from "../AdminLayout.jsx";
import "./VolunteerApplications.css";

const STATUS_LABELS = {
    pending_review: "Pending review",
    approved: "Approved",
    rejected: "Declined"
};

function formatDate(value) {
    return new Date(value).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

export default function VolunteerApplicationReview({ applicationId }) {
    const [state, setState] = useState({
        status: "loading",
        application: null,
        error: null
    });
    const [declineReason, setDeclineReason] = useState("");
    const [decisionState, setDecisionState] = useState({
        saving: false,
        error: "",
        message: ""
    });

    useEffect(() => {
        const controller = new AbortController();

        fetch(`/api/volunteer-applications/${applicationId}`, {
            headers: { Accept: "application/json" },
            signal: controller.signal
        })
            .then(async (response) => {
                const body = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(body?.error || "Application could not be loaded.");
                }

                return body;
            })
            .then((application) => {
                if (!controller.signal.aborted) {
                    setState({ status: "ready", application, error: null });
                }
            })
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setState({ status: "error", application: null, error });
                }
            });

        return () => controller.abort();
    }, [applicationId]);

    async function submitDecision(decision) {
        setDecisionState({ saving: true, error: "", message: "" });

        try {
            const response = await fetch(
                `/api/volunteer-applications/${applicationId}/decision`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json"
                    },
                    body: JSON.stringify({
                        decision,
                        reason: decision === "rejected" ? declineReason : ""
                    })
                }
            );
            const body = await response.json().catch(() => ({}));

            if (response.status === 409) {
                setDecisionState({
                    saving: false,
                    error: "This application was already reviewed by another administrator.",
                    message: ""
                });
                return;
            }

            if (!response.ok && response.status !== 202) {
                throw new Error(body.error || "The decision could not be saved.");
            }

            setState((current) => ({
                ...current,
                application: {
                    ...current.application,
                    status: decision,
                    reviewReason: body.reason || null
                }
            }));
            setDecisionState({
                saving: false,
                error: "",
                message: body.emailSent
                    ? "Decision saved and email sent."
                    : body.warning || "Decision saved, but the email could not be sent."
            });
        } catch (error) {
            setDecisionState({
                saving: false,
                error: error.message,
                message: ""
            });
        }
    }

    if (state.status === "loading") {
        return (
            <AdminLayout>
                <p className="admin-volunteers__message" role="status">
                    Loading volunteer application...
                </p>
            </AdminLayout>
        );
    }

    if (state.status === "error") {
        return (
            <AdminLayout>
                <a href="/admin/volunteers">← Back to applications</a>
                <p className="admin-volunteers__message admin-volunteers__message--error" role="alert">
                    {state.error.message}
                </p>
            </AdminLayout>
        );
    }

    const application = state.application;

    return (
        <AdminLayout>
            <a href="/admin/volunteers">← Back to applications</a>
            <h1>{application.applicantName}</h1>
            <p className="admin-subtitle">Volunteer application #{application.id}</p>

            <dl className="admin-volunteers__details">
                <dt>Opportunity</dt>
                <dd>{application.opportunity}</dd>

                <dt>Submitted</dt>
                <dd>{formatDate(application.submittedAt)}</dd>

                <dt>Review status</dt>
                <dd>{STATUS_LABELS[application.status] || application.status}</dd>

                {application.reviewedBy && (
                    <>
                        <dt>Reviewed by</dt>
                        <dd>{application.reviewedBy}</dd>
                    </>
                )}

                {application.reviewedAt && (
                    <>
                        <dt>Reviewed at</dt>
                        <dd>{formatDate(application.reviewedAt)}</dd>
                    </>
                )}

                <dt>Email</dt>
                <dd><a href={`mailto:${application.applicantEmail}`}>{application.applicantEmail}</a></dd>

                <dt>Phone</dt>
                <dd>{application.phone}</dd>

                <dt>Interests and skills</dt>
                <dd>{application.interestsSkills}</dd>

                <dt>Availability</dt>
                <dd>{application.availability}</dd>

                <dt>Reason for volunteering</dt>
                <dd>{application.reason}</dd>
            </dl>

            {application.status === "pending_review" && (
                <section className="admin-volunteers__decision">
                    <h2>Make a decision</h2>

                    <label htmlFor="decline-reason">
                        Decline reason <span>(optional)</span>
                    </label>
                    <textarea
                        id="decline-reason"
                        value={declineReason}
                        onChange={(event) => setDeclineReason(event.target.value)}
                        rows={5}
                        maxLength={2000}
                    />

                    <div className="admin-volunteers__decision-actions">
                        <button
                            type="button"
                            disabled={decisionState.saving}
                            onClick={() => submitDecision("approved")}
                        >
                            Approve application
                        </button>
                        <button
                            type="button"
                            disabled={decisionState.saving}
                            onClick={() => submitDecision("rejected")}
                        >
                            Decline application
                        </button>
                    </div>

                    {decisionState.error && (
                        <p className="admin-volunteers__message admin-volunteers__message--error" role="alert">
                            {decisionState.error}
                        </p>
                    )}
                    {decisionState.message && (
                        <p className="admin-volunteers__message" role="status">
                            {decisionState.message}
                        </p>
                    )}
                </section>
            )}
        </AdminLayout>
    );
}
