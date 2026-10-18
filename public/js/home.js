/* HOW-337: Render homepage classes from the data source. */
/* js cleaned up, fixed bugs, and became functional under ChatGPT GPT-6.1 Sol */

import { getHomepageContent } from "./home-data.js";

function createClassCard(classItem) {
  const card = document.createElement("article");
  card.className = "class-card";

  const format = document.createElement("p");
  format.className = "class-format";
  format.textContent = classItem.format;

  const title = document.createElement("h3");
  title.textContent = classItem.title;

  const schedule = document.createElement("p");
  schedule.textContent = classItem.schedule;

  const location = document.createElement("p");
  location.textContent = classItem.location;

  card.append(format, title, schedule, location);
  return card;
}

async function loadHomepage() {
  const container = document.querySelector("#weekly-classes");
  if (!container) return;

  const status = document.createElement("p");
  status.className = "content-status";
  status.setAttribute("role", "status");
  status.textContent = "Loading classes…";
  container.replaceChildren(status);

  try {
    const content = await getHomepageContent();

    if (!Array.isArray(content.classes)) {
      throw new Error("Expected a list of classes.");
    }

    const cards = content.classes.map(createClassCard);

    if (cards.length === 0) {
      status.textContent = "No upcoming classes are available yet.";
      return;
    }

    container.replaceChildren(...cards);
  } catch (error) {
    console.error("Could not load homepage classes:", error);
    status.textContent =
      "Classes could not load. Please refresh to try again.";
    container.replaceChildren(status);
  }
}

loadHomepage();