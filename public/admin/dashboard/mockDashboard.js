// Sprint 1 mock data for the admin dashboard. Replace with real API data later.
export const mockDashboard = {
    stats: {
        upcomingClasses: 12,
        pendingVolunteers: 4,
        totalDonations: 3250,
        registeredParticipants: 186,
    },
    upcomingClasses: [
        { id: 1, name: "Yoga for All Levels", date: "2026-10-20", time: "6:00 PM", registered: 14 },
        { id: 2, name: "Meditation for Beginners", date: "2026-10-21", time: "7:00 PM", registered: 22 },
        { id: 3, name: "Sound Healing Workshop", date: "2026-10-22", time: "5:30 PM", registered: 9 },
        { id: 4, name: "Tai Chi in the Park", date: "2026-10-24", time: "9:00 AM", registered: 17 },
        { id: 5, name: "Breathwork Basics", date: "2026-10-25", time: "10:30 AM", registered: 11 },
    ],
    recentDonations: [
        { id: 1, donor: "Jordan Lee", amount: 50, date: "2026-10-17" },
        { id: 2, donor: null, amount: 25, date: "2026-10-16" },
        { id: 3, donor: "Morgan Patel", amount: 100, date: "2026-10-15" },
        { id: 4, donor: "Casey Nguyen", amount: 20, date: "2026-10-14" },
        { id: 5, donor: null, amount: 250, date: "2026-10-12" },
    ],
};
