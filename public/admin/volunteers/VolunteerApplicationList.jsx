import { useEffect, useState } from "react";
import AdminLayout from "../AdminLayout.jsx";
import "./VolunteerApplications.css";

const STATUS_LABELS = {
    pending_review: "Pending review",
    approved: "Approved",
    rejected: "Declined"
};

const STATUS_OPTIONS = [
    { value: "all", label: "All applications" },
    { value: "pending_review", label: "Pending review" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Declined" }
];

function formatDate(value) {
    return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

export default function VolunteerApplicationList() {
    const [status, setStatus] = useState("all");
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState({
        status: "loading",
        applications: [],
        error: null
    });

    useEffect(() => {
        const controller = new AbortController();
        const query = status === "all" ? "" : `?status=${encodeURIComponent(status)}`;

        setState({ status: "loading", applications: [], error: null });

        fetch(`/api/volunteer-applications${query}`, {
            headers: { Accept: "application/json" },
            signal: controller.signal
        })
            .then(async (response) => {
                const body = await response.json().catch(() => null);

                if (!response.ok) {
                    const error = new Error(
                        body?.error || "Volunteer applications could not be loaded."
                    );
                    error.status = response.status;
                    throw error;
                }

                return body;
            })
            .then((applications) => {
                if (!controller.signal.aborted) {
                    setState({ status: "ready", applications, error: null });
                }
            })
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setState({ status: "error", applications: [], error });
                }
            });

        return () => controller.abort();
    }, [status, attempt]);

    const { status: loadStatus, applications, error } = state;

    return (
        <AdminLayout>
            <h1>Volunteer Applications</h1>
            <p className="admin-subtitle">
                Review volunteer applications submitted through Heal One World.
            </p>

            <div className="admin-volunteers__controls">
                <label htmlFor="volunteer-status">Review status</label>
                <select
                    id="volunteer-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                >
                    {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {loadStatus === "loading" && (
                <p className="admin-volunteers__message" role="status">
                    Loading volunteer applications...
                </p>
            )}

            {loadStatus === "error" && (
                <div className="admin-volunteers__message admin-volunteers__message--error" role="alert">
                    <p>{error.message}</p>
                    <button type="button" onClick={() => setAttempt((value) => value + 1)}>
                        Try again
                    </button>
                </div>
            )}

            {loadStatus === "ready" && applications.length === 0 && (
                <p className="admin-volunteers__message">
                    {status === "all"
                        ? "No volunteer applications have been submitted."
                        : "No applications match this review status."}
                </p>
            )}

            {loadStatus === "ready" && applications.length > 0 && (
                <div className="admin-volunteers__table-wrap">
                    <table className="admin-volunteers__table">
                        <thead>
                            <tr>
                                <th scope="col">Applicant</th>
                                <th scope="col">Opportunity</th>
                                <th scope="col">Submitted</th>
                                <th scope="col">Review status</th>
                                <th scope="col">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map((application) => (
                                <tr key={application.id}>
                                    <td data-label="Applicant">{application.applicantName}</td>
                                    <td data-label="Opportunity">{application.opportunity}</td>
                                    <td data-label="Submitted">{formatDate(application.submittedAt)}</td>
                                    <td data-label="Review status">
                                        <span className={`admin-volunteers__status admin-volunteers__status--${application.status}`}>
                                            {STATUS_LABELS[application.status] || application.status}
                                        </span>
                                    </td>
                                    <td data-label="Action">
                                        <a href={`/admin/volunteers/${application.id}`}>
                                            {application.status === "pending_review" ? "Review" : "View"}
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
}
