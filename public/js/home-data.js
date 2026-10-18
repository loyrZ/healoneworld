/* HOW-338: Development samples, not a live class schedule!! */

export async function getHomepageContent() {
  return {
    classes: [
      {
        format: "Sample · In person",
        title: "Community Yoga — sample",
        schedule: "Example: Wednesday · 10:00–11:30 AM",
        location: "Example location: Heal One World studio"
      },
      {
        format: "Sample · Online",
        title: "Reiki Circle — sample",
        schedule: "Example: Wednesday · 1:00–2:30 PM",
        location: "Online preview — no meeting link available"
      },
      {
        format: "Sample · In person",
        title: "Tai Chi — sample",
        schedule: "Example schedule — time to be confirmed",
        location: "Example location: Heal One World studio"
      }
    ],
    announcements: []
  };
}