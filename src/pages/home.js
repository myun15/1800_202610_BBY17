import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { db } from "/src/helper/firebaseConfig.js";
import { onAuthReady } from "/src/helper/authentication.js";

// --- Map Preview ---
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const VANCOUVER = { lng: -123.1207, lat: 49.2827 };

let userLocation = null;
let previewMap = null;
let restaurantMarkers = [];

const STATUS_CONFIG = {
  empty: {
    label: "Empty",
    className: "crowd-empty",
    markerColor: "#22c55e",
  },
  busy: {
    label: "Busy",
    className: "crowd-busy",
    markerColor: "#f59e0b",
  },
  full: {
    label: "Full",
    className: "crowd-full",
    markerColor: "#ef4444",
  },
};

function initPreviewMap() {
  const mapEl = document.getElementById("map-preview");
  if (!mapEl) return;

  const map = new maplibregl.Map({
    container: mapEl,
    style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
    center: [VANCOUVER.lng, VANCOUVER.lat],
    zoom: 13,
  });

  map.scrollZoom.disable();

  map.addControl(new maplibregl.NavigationControl(), "top-right");

  map.on("load", async () => {
    await initRestaurantPins(map);
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;

        userLocation = { lng: longitude, lat: latitude };

        map.setCenter([longitude, latitude]);

        new maplibregl.Marker({ color: "#2563eb" })
          .setLngLat([longitude, latitude])
          .setPopup(new maplibregl.Popup().setText("You are here"))
          .addTo(map);

        await initRestaurantPins(map);
      },
      () => {
        console.log("Location denied, showing Vancouver");
      },
    );
  }
}

// --- Welcome Message ---
function showNameWhenLoggedIn() {
  onAuthReady((user) => {
    const nameElement = document.getElementById("welcome-user");
    if (!user) {
      if (nameElement) nameElement.textContent = "";
      return;
    }

    const name = user.displayName || user.email;
    if (nameElement) nameElement.textContent = `Welcome ${name}`;
  });
}

// --- Restaurant Seeding from Yelp ---
async function fetchRestaurantsFromYelp() {
  const params = new URLSearchParams({
    latitude: VANCOUVER.lat,
    longitude: VANCOUVER.lng,
    categories: "restaurants",
    limit: "10",
    offset: "0",
  });

  const response = await fetch(`/api/yelp/businesses/search?${params}`);
  if (!response.ok) {
    console.error("Yelp API error:", response.status);
    return [];
  }

  const data = await response.json();
  return (data.businesses || []).slice(0, 10);
}

async function seedRestaurants() {
  const restaurantsRef = collection(db, "restaurants");
  const querySnapshot = await getDocs(restaurantsRef);

  if (!querySnapshot.empty) {
    console.log(
      "Restaurant collection already contains data. Skipping seed...",
    );
    return;
  }

  console.log("Seeding restaurants from Yelp...");
  const places = await fetchRestaurantsFromYelp();

  for (const place of places) {
    const loc = place.location || {};
    await addDoc(restaurantsRef, {
      name: place.name || "Unknown Restaurant",
      address: loc.address1 || "",
      city: loc.city || "Vancouver",
      cuisine: (place.categories || []).map((c) => c.title).join(", ") || "",
      lat: String(place.coordinates?.latitude || ""),
      lng: String(place.coordinates?.longitude || ""),
      imageSrc: place.image_url || "",
      rating: place.rating ?? null,
      status: "empty",
      lastUpdated: null,
    });
  }

  console.log(`Seeded ${places.length} restaurants from Yelp.`);
}

// --- Helper functions ---
function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeStatus(status = "") {
  const value = status.toString().trim().toLowerCase();

  if (value === "low") return STATUS_CONFIG.empty;
  if (value === "medium" || value === "moderate") return STATUS_CONFIG.busy;
  if (value === "high") return STATUS_CONFIG.full;

  if (STATUS_CONFIG[value]) {
    return STATUS_CONFIG[value];
  }

  return {
    label: "No update yet",
    className: "crowd-unknown",
    markerColor: "#9ca3af",
  };
}

function getRestaurantImage(data) {
  const defaultImage =
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";

  if (data.imageSrc && data.imageSrc.trim() !== "") {
    return data.imageSrc;
  }

  return defaultImage;
}

function getOpenText(data) {
  if (data.hours && data.hours.trim() !== "") {
    return data.hours;
  }

  return "Hours not available";
}

function calculateDistance(lat1, lng1, lat2, lng2) {
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

function getDistanceText(data) {
  if (!userLocation || !data.lat || !data.lng) {
    return "📍 Nearby";
  }

  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    parseFloat(data.lat),
    parseFloat(data.lng),
  );

  return `📍 ${distance.toFixed(1)} km`;
}

function formatTimeAgo(timestamp) {
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

function createMarkerElement(statusValue) {
  const status = normalizeStatus(statusValue);
  const markerEl = document.createElement("div");
  markerEl.className = "custom-status-marker";
  markerEl.style.backgroundColor = status.markerColor;
  return markerEl;
}

function buildPopupHTML(id, data) {
  const status = normalizeStatus(data.status);
  const image = getRestaurantImage(data);
  const openText = getOpenText(data);
  const distanceText = getDistanceText(data);
  const lastUpdatedText = formatTimeAgo(data.lastUpdated);

  return `
    <div class="restaurant-popup-card">
      <img
        class="restaurant-popup-image"
        src="${escapeHTML(image)}"
        alt="${escapeHTML(data.name || "Restaurant image")}"
        onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80';"
      />

      <div class="restaurant-popup-body">
        <h3 class="restaurant-popup-title">
          ${escapeHTML(data.name || "Unknown Restaurant")}
        </h3>

        <p class="restaurant-popup-cuisine">
          ${escapeHTML(
            data.cuisine
              ? data.cuisine.charAt(0).toUpperCase() + data.cuisine.slice(1)
              : "Restaurant"
          )}
        </p>

        <p class="restaurant-popup-address">
          ${escapeHTML(data.address || "Address not available")}
        </p>

        <div class="restaurant-popup-meta">
          ${data.rating != null ? `<span>⭐ ${escapeHTML(data.rating)}</span>` : ""}
          <span>${distanceText}</span>
        </div>

        <div class="restaurant-popup-meta">
          <span>${escapeHTML(openText)}</span>
        </div>

        <div class="restaurant-popup-badge ${status.className}">
          ${status.label}
        </div>

        <p class="restaurant-last-updated">
          Updated ${lastUpdatedText}
        </p>

        <div class="restaurant-update-controls">
          <select id="status-select-${id}" class="status-select">
            <option value="empty" ${data.status === "empty" ? "selected" : ""}>Empty</option>
            <option value="busy" ${data.status === "busy" ? "selected" : ""}>Busy</option>
            <option value="full" ${data.status === "full" ? "selected" : ""}>Full</option>
          </select>

          <button class="update-status-btn" onclick="window.updateRestaurantStatus('${id}')">
            Update
          </button>
        </div>

        <div class="restaurant-popup-actions">
          <button class="view-details-btn" onclick="window.goToRestaurantPage('${id}')">
            View Details
          </button>

          <button
            id="favorite-btn-${id}"
            class="favorite-popup-btn"
            onclick="window.toggleFavorite(this, '${id}')"
            ♡
            >
          </button>
        </div>
      </div>
    </div>
  `;
}

// --- Restaurant Pins ---
async function initRestaurantPins(map) {
  restaurantMarkers.forEach((marker) => marker.remove());
  restaurantMarkers = [];

  const snapshot = await getDocs(collection(db, "restaurants"));

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    if (!data.lat || !data.lng) return;

    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

const popup = new maplibregl.Popup({
  closeButton: true,
  closeOnClick: true,
  maxWidth: "320px",
  offset: 25,
}).setHTML(buildPopupHTML(id, data));

popup.on("open", () => {
  setTimeout(() => {
    window.syncFavoriteButton(id);
  }, 0);
});

    const marker = new maplibregl.Marker({
      element: createMarkerElement(data.status),
    })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map);

    restaurantMarkers.push(marker);
  });
}

async function updateRestaurantStatusById(restaurantId) {
  const select = document.getElementById(`status-select-${restaurantId}`);
  if (!select) return;

  const newStatus = select.value;

  try {
    const restaurantRef = doc(db, "restaurants", restaurantId);

    await updateDoc(restaurantRef, {
      status: newStatus,
      lastUpdated: serverTimestamp(),
    });

    if (previewMap) {
      await initRestaurantPins(previewMap);
    }
  } catch (error) {
    console.error("Error updating restaurant status:", error);
    alert("Could not update restaurant status.");
  }
}

window.updateRestaurantStatus = updateRestaurantStatusById;
function goToRestaurantPage(restaurantId) {
  const recentRestaurants =
    JSON.parse(localStorage.getItem("recentRestaurants")) || [];

  const updatedRecents = [
    restaurantId,
    ...recentRestaurants.filter((id) => id !== restaurantId),
  ].slice(0, 10);

  localStorage.setItem("recentRestaurants", JSON.stringify(updatedRecents));

  window.location.href = `/restaurant-detail.html?id=${restaurantId}`;
}

window.goToRestaurantPage = goToRestaurantPage;

window.addEventListener("load", initPreviewMap);
showNameWhenLoggedIn();
seedRestaurants();

async function toggleFavorite(restaurantID) {
  onAuthReady(async (user) => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const bookmarks = userSnap.data()?.bookmarks || [];
    const isBookmarked = bookmarks.includes(restaurantID);

    try {
      if (isBookmarked) {
        await updateDoc(userRef, { bookmarks: arrayRemove(restaurantID) });
        console.log("Removed from favorites");
      } else {
        await updateDoc(userRef, { bookmarks: arrayUnion(restaurantID) });
        console.log("Added to favorites");
      }
    } catch (err) {
      console.error("Error updating favorite:", err);
      alert("Could not update favorites.");
    }
  });
}
async function syncFavoriteButton(restaurantID) {
  onAuthReady(async (user) => {
    if (!user) return;

    try {
      const buttonEl = document.getElementById(`favorite-btn-${restaurantID}`);
      if (!buttonEl) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        buttonEl.classList.remove("is-favorited");
        buttonEl.innerHTML = "♡";
        return;
      }

      const bookmarks = userSnap.data()?.bookmarks || [];
      const isBookmarked = bookmarks.includes(restaurantID);

      if (isBookmarked) {
        buttonEl.classList.add("is-favorited");
        buttonEl.innerHTML = "♥";
      } else {
        buttonEl.classList.remove("is-favorited");
        buttonEl.innerHTML = "♡";
      }
    } catch (error) {
      console.error("Error syncing favorite button:", error);
    }
  });
}

window.syncFavoriteButton = syncFavoriteButton;
window.toggleFavorite = toggleFavorite;
