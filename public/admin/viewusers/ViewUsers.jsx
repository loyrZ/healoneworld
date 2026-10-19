import { useEffect, useState } from "react";
import "../../css/layout.css";
import "../../css/theme.css";
import "../../css/components.css";
import "./ViewUsers.css";
import { placeholderUsers } from "./placeholderUsers.js";


const ROLES = ["User", "Staff", "Admin"];

async function fetchUsers() {
    const res = await fetch("/admin/users", { headers: { Accept: "application/json" } });
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    if (!res.ok || !isJson) {
        throw new Error(`GET /admin/users returned ${res.status}`);
    }
    return res.json();
}

function ViewUsers() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [usingPlaceholder, setUsingPlaceholder] = useState(false);
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("All");

    useEffect(() => {
        fetchUsers()
            .then(setUsers)
            .catch((err) => {
                console.warn("Using placeholder users:", err.message);
                setUsers(placeholderUsers);
                setUsingPlaceholder(true);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const query = search.trim().toLowerCase();
    const shownUsers = users.filter((user) => {
        const matchesRole = role === "All" || user.role === role;
        const matchesSearch =
            !query ||
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query);
        return matchesRole && matchesSearch;
    });

    return (
        <main className="admin-users container">
            <p className="admin-users__eyebrow">Admin</p>
            <h1>Users &amp; Staff</h1>
            <p className="admin-users__intro">Everyone with an account, and what they can access.</p>

            {usingPlaceholder && (
                <p className="admin-users__notice" role="status">
                    Showing placeholder data. The user list couldn't be loaded from the server.
                </p>
            )}

            <div className="admin-users__controls">
                <div className="admin-users__field">
                    <label htmlFor="user-search">Search</label>
                    <input
                        id="user-search"
                        type="search"
                        placeholder="Search by name or email"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>

                <div className="admin-users__field">
                    <label htmlFor="role-filter">Role</label>
                    <select
                        id="role-filter"
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                    >
                        <option value="All">All roles</option>
                        {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
            </div>

            {isLoading ? (
                <p className="admin-users__message">Loading accounts...</p>
            ) : (
                <>
                    <p className="admin-users__count" aria-live="polite">
                        Showing {shownUsers.length} of {users.length} accounts
                    </p>

                    {shownUsers.length === 0 ? (
                        <p className="admin-users__message">
                            No users match your search or filter.
                        </p>
                    ) : (
                        <table className="admin-users__table">
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">Email</th>
                                    <th scope="col">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shownUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td data-label="Name">{user.name}</td>
                                        <td data-label="Email">
                                            <a href={`mailto:${user.email}`}>{user.email}</a>
                                        </td>
                                        <td data-label="Role">
                                            <span className={`role-badge role-badge--${user.role.toLowerCase()}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </main>
    );
}

export default ViewUsers;
