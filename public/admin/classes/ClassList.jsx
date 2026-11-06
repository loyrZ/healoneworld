/* HOW-104: Admin class list with search and filters. Layout from the Figma "Mock Up Prototype" file, frame "Admin / Classes & Events". */
//  Claude Revised 

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import "../../css/layout.css";
import "../../css/theme.css";
import "../../css/components.css";
import AdminLayout from "../AdminLayout.jsx";
import {
    FORMAT_LABELS,
    NO_FILTERS,
    STATUS_LABELS,
    filterClasses,
    formatShortDate,
    formatTime,
    instructorsOf,
    registrationLabel,
} from "./classData.mjs";
import "./ClassList.css";

// Shown at /admin/classes. Data comes from GET /api/classes/admin (routes/classes.js).

const LOAD_ERRORS = {
    401: "Please sign in with an administrator account to manage classes.",
    403: "You don't have permission to manage classes.",
};

// /admin/classes?created=12 is where the create page sends you after saving class 12.
function takeCreatedId() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("created"));
    if (!params.has("created")) return null;

    // Drop the parameter so a refresh doesn't repeat the message.
    window.history.replaceState(null, "", window.location.pathname);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function ClassRow({ item, isNew }) {
    return (
        <li className={`admin-row admin-classes__row${isNew ? " admin-classes__row--new" : ""}`}>
            <span className="admin-classes__title">{item.title}</span>
            <span>
                {formatShortDate(item.date)}
                {item.startTime && ` • ${formatTime(item.startTime)}`}
            </span>
            <span>{FORMAT_LABELS[item.format] ?? item.format}</span>
            <span>{registrationLabel(item)}</span>
            <span className={`admin-classes__status admin-classes__status--${item.status}`}>
                {STATUS_LABELS[item.status] ?? item.status}
            </span>
            <a
                className="admin-classes__edit"
                href={`/admin/classes/${item.id}/edit`}
                aria-label={`Edit ${item.title}`}
            >
                Edit
            </a>
        </li>
    );
}

function ClassList() {
    const { isLoaded, isSignedIn } = useAuth();
    const [load, setLoad] = useState({ status: "loading", classes: [], error: null });
    const [attempt, setAttempt] = useState(0);
    const [filters, setFilters] = useState(NO_FILTERS);
    const [createdId] = useState(takeCreatedId);

    // Load classes when the page opens, on retry, and when coming back with Back.
    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            setLoad({ status: "error", classes: [], error: { status: 401, message: LOAD_ERRORS[401] } });
            return;
        }

        let cancelled = false;
        setLoad((current) => ({ ...current, status: "loading", error: null }));

        fetch("/api/classes/admin", { headers: { Accept: "application/json" } })
            .then(async (res) => {
                if (!res.ok) {
                    const error = new Error(LOAD_ERRORS[res.status] ?? "Classes could not be loaded.");
                    error.status = res.status;
                    throw error;
                }
                return res.json();
            })
            .then((classes) => {
                if (!cancelled) setLoad({ status: "ready", classes, error: null });
            })
            .catch((err) => {
                if (cancelled) return;
                // Never fall back to mock data: show what went wrong instead.
                setLoad({
                    status: "error",
                    classes: [],
                    error: {
                        status: err.status,
                        message: err.status ? err.message : "Could not reach the server. Check your connection.",
                    },
                });
            });

        return () => {
            cancelled = true;
        };
    }, [isLoaded, isSignedIn, attempt]);

    // Browsers can restore this page from cache after editing a class; reload so changes show.
    useEffect(() => {
        function handlePageShow(event) {
            if (event.persisted) setAttempt((count) => count + 1);
        }
        window.addEventListener("pageshow", handlePageShow);
        return () => window.removeEventListener("pageshow", handlePageShow);
    }, []);

    function updateFilter(event) {
        const { name, value } = event.target;
        setFilters((current) => ({ ...current, [name]: value }));
    }

    const filtered = filterClasses(load.classes, filters);
    const published = filtered.filter((item) => item.status === "published");
    const pending = filtered.filter((item) => item.status === "pending");
    const filtersActive = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);
    const createdClass = load.classes.find((item) => item.id === createdId);

    let content;

    if (load.status === "loading") {
        content = <p role="status" className="admin-classes__message">Loading classes…</p>;
    } else if (load.status === "error") {
        content = (
            <div role="alert" className="admin-classes__message admin-classes__message--error">
                <p>{load.error.message}</p>
                {load.error.status === 401 ? (
                    <a className="admin-classes__button" href="/sign-in">Sign in</a>
                ) : load.error.status !== 403 && (
                    <button type="button" className="admin-classes__button" onClick={() => setAttempt((count) => count + 1)}>
                        Try again
                    </button>
                )}
            </div>
        );
    } else if (load.classes.length === 0) {
        content = <p className="admin-classes__message">No classes available.</p>;
    } else if (filtered.length === 0) {
        content = <p className="admin-classes__message">No classes found.</p>;
    } else {
        content = (
            <>
                {published.length > 0 && (
                    <section aria-labelledby="published-heading">
                        <h2 id="published-heading">Published classes</h2>
                        <ul className="admin-classes__list">
                            {published.map((item) => <ClassRow key={item.id} item={item} isNew={item.id === createdId} />)}
                        </ul>
                    </section>
                )}
                {pending.length > 0 && (
                    <section aria-labelledby="pending-heading">
                        <h2 id="pending-heading">Classes awaiting approval</h2>
                        <p className="admin-subtitle">
                            Volunteer-submitted classes that are not shown to visitors yet.
                        </p>
                        <ul className="admin-classes__list">
                            {pending.map((item) => <ClassRow key={item.id} item={item} isNew={item.id === createdId} />)}
                        </ul>
                    </section>
                )}
            </>
        );
    }

    return (
        <AdminLayout>
            <h1>Classes &amp; events</h1>
            <p className="admin-subtitle">Find, review, and edit upcoming activities.</p>

            <div className="admin-classes__create">
                <a className="admin-classes__button" href="/admin/classes/new">Create class</a>
            </div>

            {createdClass && (
                <p role="status" className="admin-classes__notice">
                    “{createdClass.title}” was created and published.
                </p>
            )}

            <form
                className="admin-classes__filters"
                role="search"
                aria-label="Filter classes"
                onSubmit={(event) => event.preventDefault()}
            >
                <div className="admin-classes__field admin-classes__field--wide">
                    <label htmlFor="class-search">Search by class name</label>
                    <input
                        id="class-search"
                        name="search"
                        type="search"
                        value={filters.search}
                        onChange={updateFilter}
                    />
                </div>
                <div className="admin-classes__field">
                    <label htmlFor="class-from">From</label>
                    <input id="class-from" name="from" type="date" value={filters.from} max={filters.to || undefined} onChange={updateFilter} />
                </div>
                <div className="admin-classes__field">
                    <label htmlFor="class-to">To</label>
                    <input id="class-to" name="to" type="date" value={filters.to} min={filters.from || undefined} onChange={updateFilter} />
                </div>
                <div className="admin-classes__field">
                    <label htmlFor="class-status">Status</label>
                    <select id="class-status" name="status" value={filters.status} onChange={updateFilter}>
                        <option value="all">All statuses</option>
                        <option value="published">{STATUS_LABELS.published}</option>
                        <option value="pending">{STATUS_LABELS.pending}</option>
                    </select>
                </div>
                <div className="admin-classes__field">
                    <label htmlFor="class-instructor">Instructor</label>
                    <select id="class-instructor" name="instructor" value={filters.instructor} onChange={updateFilter}>
                        <option value="all">All instructors</option>
                        {instructorsOf(load.classes).map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    className="admin-classes__clear"
                    disabled={!filtersActive}
                    onClick={() => setFilters(NO_FILTERS)}
                >
                    Clear filters
                </button>
            </form>

            {load.status === "ready" && load.classes.length > 0 && (
                <p role="status" className="admin-classes__count">
                    Showing {filtered.length} of {load.classes.length} classes
                </p>
            )}

            {content}
        </AdminLayout>
    );
}

export default ClassList;
