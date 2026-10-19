import "../../css/layout.css";
import "../../css/theme.css";
import "../../css/components.css";
import "./Dashboard.css";
import { mockDashboard } from "./mockDashboard.js";

// Admin dashboard, shown at /admin/dashboard.
// Sprint 1: uses mock data from mockDashboard.js.
// These are mock data only, claude will be holding this page until we have the proper data tables to fill it in. 

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function formatDate(isoDate) {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

function Dashboard() {
    const { stats, upcomingClasses, recentDonations } = mockDashboard;
    const nextClasses = upcomingClasses.slice(0, 5);
    const lastDonations = recentDonations.slice(0, 5);

    const cards = [
        { label: "Upcoming classes", value: stats.upcomingClasses, href: "/admin/classes" },
        { label: "Pending volunteer applications", value: stats.pendingVolunteers, href: "/admin/volunteers" },
        { label: "Total donations", value: money.format(stats.totalDonations), href: "/admin/donations" },
        { label: "Registered participants", value: stats.registeredParticipants, href: "/admin/viewusers" },
    ];

    return (
        <main className="admin-dashboard container">
            <h1>Dashboard</h1>

            <section className="admin-dashboard__cards" aria-label="Summary">
                {cards.map((card) => (
                    <a key={card.label} className="admin-dashboard__card" href={card.href}>
                        <span className="admin-dashboard__value">{card.value}</span>
                        <span>{card.label}</span>
                    </a>
                ))}
            </section>

            <div className="admin-dashboard__sections">
                <section>
                    <h2>Upcoming classes &amp; events</h2>
                    {nextClasses.length === 0 ? (
                        <p>No upcoming classes or events.</p>
                    ) : (
                        <table className="admin-dashboard__table">
                            <thead>
                                <tr>
                                    <th scope="col">Class</th>
                                    <th scope="col">Date</th>
                                    <th scope="col">Time</th>
                                    <th scope="col">Registered</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nextClasses.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td>{formatDate(item.date)}</td>
                                        <td>{item.time}</td>
                                        <td>{item.registered}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    <a href="/admin/classes">View all classes</a>
                </section>

                <section>
                    <h2>Recent donations</h2>
                    {lastDonations.length === 0 ? (
                        <p>No donations yet.</p>
                    ) : (
                        <table className="admin-dashboard__table">
                            <thead>
                                <tr>
                                    <th scope="col">Donor</th>
                                    <th scope="col">Amount</th>
                                    <th scope="col">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lastDonations.map((donation) => (
                                    <tr key={donation.id}>
                                        <td>{donation.donor || "Anonymous"}</td>
                                        <td>{money.format(donation.amount)}</td>
                                        <td>{formatDate(donation.date)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    <a href="/admin/donations">View all donations</a>
                </section>
            </div>
        </main>
    );
}

export default Dashboard;
