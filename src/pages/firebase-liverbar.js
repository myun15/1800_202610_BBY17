import { collection, onSnapshot } from "firebase/firestore";
import { db } from "/src/helper/firebaseConfig.js";

console.log("DB =", db);
const ticker = document.getElementById("liveTicker");

// --- previous Live Ticker ---
const previousStatuses = {};
const activeTrends = {};
// Stores the timestamp of the last status change for each restaurant
let hasInitialized = false;

function getTrendDirection(oldStatus, newStatus) {
  const oldLevel = getStatusLevel(oldStatus);
  const newLevel = getStatusLevel(newStatus);

  if (!oldStatus || oldLevel === 0 || newLevel === 0) {
    return "flat";
  }

  if (newLevel > oldLevel) return "up";
  if (newLevel < oldLevel) return "down";
  return "flat";
}

function renderTrendSymbol(direction) {
  if (direction === "up") return "▲";
  if (direction === "down") return "▼";
  return "•";
}

function normalizeStatus(status) {
  const s = (status || "").toLowerCase();

  if (s.includes("empty") || s.includes("low")) return "empty";
  if (s.includes("busy") || s.includes("medium") || s.includes("wait"))
    return "busy";
  if (s.includes("full") || s.includes("high") || s.includes("sold out"))
    return "full";
  return "unknown";
}

function getStatusLevel(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "empty") return 1;
  if (normalized === "busy") return 2;
  if (normalized === "full") return 3;
  return 0;
}

function getStatusBadge(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "empty") return "🟢 Empty";
  if (normalized === "busy") return "🟡 Busy";
  if (normalized === "full") return "🔴 Full";
  return "⚪ Unknown";
}
function formatTimeAgo(timestamp) {
  if (!timestamp) return "";

  let timeMs;

  // Firestore Timestamp
  if (typeof timestamp.toDate === "function") {
    timeMs = timestamp.toDate().getTime();
  } else if (typeof timestamp === "number") {
    timeMs = timestamp;
  } else {
    return "";
  }

  const diffSeconds = Math.floor((Date.now() - timeMs) / 1000);

  if (diffSeconds < 15) return "just updated";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours} hr ago`;
}

const restaurantsCollection = collection(db, "restaurants");

onSnapshot(restaurantsCollection, (snapshot) => {
  if (!ticker) return;

  if (snapshot.empty) {
    ticker.textContent = "No live updates yet";
    return;
  }

  const now = Date.now();

  const items = snapshot.docs.map((doc) => {
    const restaurant = doc.data();
    const id = doc.id;
    const name = restaurant.name || "Unknown";
    const currentStatus = restaurant.status || "unknown";
    const previousStatus = previousStatuses[id];

    const lastTrendTime = restaurant.lastUpdated;

    if (hasInitialized) {
      const direction = getTrendDirection(previousStatus, currentStatus);
      if (direction !== "flat") {
        activeTrends[id] = direction;
      }
    }

    const activeDirection = activeTrends[id];

    let trend = '<span class="trend-flat">•</span>';

    // if changes in 20 seconds the ▲ / ▼ shows
    if (
      activeDirection &&
      lastTrendTime &&
      typeof lastTrendTime.toDate === "function" &&
      now - lastTrendTime.toDate().getTime() <= 2000
    ) {
      trend = renderTrendSymbol(activeDirection);
    }

    const statusBadge = getStatusBadge(currentStatus);
    const timeLabel = formatTimeAgo(restaurant.lastUpdated); // show previous status for live updates
    previousStatuses[id] = currentStatus;

    return `
  <span class="ticker-item" data-id="${id}">
    <span class="ticker-name">${name}</span>
    <span class="ticker-trend">${trend}</span>
    <span class="ticker-status">${statusBadge}</span>
    <span class="ticker-time">${timeLabel ? `· ${timeLabel}` : ""}</span>
  </span>
`;
  });
  const tickerHtml = items.join("");
  ticker.innerHTML = tickerHtml + tickerHtml;
  hasInitialized = true;
});
