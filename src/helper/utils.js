const DEFAULT_RESTAURANT_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";

export const STATUS_CONFIG = {
  empty: { label: "Empty", className: "crowd-empty", markerColor: "#22c55e" },
  busy: { label: "Busy", className: "crowd-busy", markerColor: "#f59e0b" },
  full: { label: "Full", className: "crowd-full", markerColor: "#ef4444" },
};

const UNKNOWN_STATUS = {
  label: "No update yet",
  className: "crowd-unknown",
  markerColor: "#9ca3af",
};

export function normalizeStatus(status = "") {
  const value = status.toString().trim().toLowerCase();

  if (value === "low") return STATUS_CONFIG.empty;
  if (value === "medium" || value === "moderate") return STATUS_CONFIG.busy;
  if (value === "high") return STATUS_CONFIG.full;
  if (STATUS_CONFIG[value]) return STATUS_CONFIG[value];

  return UNKNOWN_STATUS;
}

export function formatCrowdStatus(status) {
  return normalizeStatus(status).label;
}

export function getStatusClass(status) {
  return normalizeStatus(status).className;
}

export function getStatusBadge(status) {
  const { label, className } = normalizeStatus(status);
  const bootstrapClass = {
    "crowd-empty": "bg-success",
    "crowd-busy": "bg-warning text-dark",
    "crowd-full": "bg-danger",
    "crowd-unknown": "bg-secondary",
  }[className];
  return `<span class="badge ${bootstrapClass}">${label}</span>`;
}

export function getRestaurantImage(data = {}) {
  if (data.imageSrc && data.imageSrc.trim() !== "") return data.imageSrc;
  return DEFAULT_RESTAURANT_IMAGE;
}

export function getDefaultRestaurantImage() {
  return DEFAULT_RESTAURANT_IMAGE;
}

export function formatCuisine(cuisine = "") {
  if (!cuisine) return "Restaurant";
  return cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return "No updates yet";

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSeconds < 10) return "Just now";
  if (diffSeconds < 60) return `${diffSeconds} sec ago`;

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
