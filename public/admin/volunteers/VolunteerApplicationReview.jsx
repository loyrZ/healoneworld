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
        </AdminLayout>
    );
}
