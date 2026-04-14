import { collection, onSnapshot } from "firebase/firestore";
import { db } from "/src/helper/firebaseConfig.js";
import {
  normalizeStatus,
  formatTimeAgo,
  getStatusLevel,
} from "../helper/utils";

const ticker = document.getElementById("liveTicker");

const previousStatuses = {};
const activeTrends = {};

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

function getStatusBadge(status) {
  const { className } = normalizeStatus(status);
  if (className === "crowd-empty") return "🟢 Empty";
  if (className === "crowd-busy") return "🟡 Busy";
  if (className === "crowd-full") return "🔴 Full";
  return "⚪ Unknown";
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

    if (
      activeDirection &&
      lastTrendTime &&
      typeof lastTrendTime.toDate === "function" &&
      now - lastTrendTime.toDate().getTime() <= 2000
    ) {
      trend = renderTrendSymbol(activeDirection);
    }

    const statusBadge = getStatusBadge(currentStatus);
    const timeLabel = formatTimeAgo(restaurant.lastUpdated);
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
