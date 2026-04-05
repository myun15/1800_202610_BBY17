import { collection, onSnapshot } from "firebase/firestore";
import { db } from "/src/helper/firebaseConfig.js";

console.log("DB =", db);
const ticker = document.getElementById("liveTicker");

// --- previous Live Ticker ---
const previousStatuses = {};
//--- Compare the previous and current status to determine trend symbol ---
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

function getTrendSymbol(oldStatus, newStatus) {
  const oldLevel = getStatusLevel(oldStatus);
  const newLevel = getStatusLevel(newStatus);

  if (!oldStatus || oldLevel === 0 || newLevel === 0) {
    return '<span class="trend-flat">•</span>';
  }

  if (newLevel > oldLevel) {
    return '<span class="trend-up">▲</span>';
  }

  if (newLevel < oldLevel) {
    return '<span class="trend-down">▼</span>';
  }

  return '<span class="trend-flat">•</span>';
}

const restaurantsCollection = collection(db, "restaurants");

onSnapshot(restaurantsCollection, (snapshot) => {
  if (!ticker) return;

  if (snapshot.empty) {
    ticker.textContent = "No live updates yet";
    return;
  }

  const items = snapshot.docs.map((doc) => {
    const restaurant = doc.data();
    const id = doc.id;
    const name = restaurant.name || "Unknown";
    const currentStatus = restaurant.status || "unknown";
    const previousStatus = previousStatuses[id];

    const trend = getTrendSymbol(previousStatus, currentStatus);
    const statusBadge = getStatusBadge(currentStatus);

    // show previous status for live updates
    previousStatuses[id] = currentStatus;

    return `
      <span class="ticker-item" data-id="${id}">
        <span class="ticker-name">${name}</span>
        <span class="ticker-trend">${trend}</span>
        <span class="ticker-status">${statusBadge}</span>
      </span>
    `;
  });

  const content = items.join(" ✦ ");
  ticker.innerHTML = `<span class="ticker-track">${content} ✦ ${content}</span>`;
});
