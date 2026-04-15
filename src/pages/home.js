import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc,
} from "firebase/firestore";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { db } from "/src/helper/firebaseConfig.js";
import { onAuthReady } from "/src/helper/authentication.js";
import {
  STATUS_CONFIG,
  normalizeStatus,
  getRestaurantImage,
  getDefaultRestaurantImage,
  formatTimeAgo,
  calculateDistance,
  escapeHTML,
} from "/src/helper/utils.js";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const VANCOUVER = { lng: -123.1207, lat: 49.2827 };

let userLocation = null;
let previewMap = null;
let restaurantMarkers = [];
let urlSearchHandled = false;

function runUrlSearch() {
  if (urlSearchHandled) return;
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  if (!q) return;
  urlSearchHandled = true;

  const input = document.getElementById("restaurant-search-input");
  if (input) input.value = q;

  window.dispatchEvent(
    new CustomEvent("restaurant-search", { detail: { searchTerm: q } }),
  );
}

class MapLegendControl {
  onAdd() {
    const items = [
      { color: STATUS_CONFIG.empty.markerColor, label: "Empty" },
      { color: STATUS_CONFIG.busy.markerColor, label: "Busy" },
      { color: STATUS_CONFIG.full.markerColor, label: "Full" },
      { color: "#9ca3af", label: "No update yet" },
      { color: "#2563eb", label: "Your location" },
    ];

    this._container = document.createElement("div");
    this._container.className = "maplibregl-ctrl map-legend";
    this._container.innerHTML = `
      <div class="map-legend-title">Crowd Status</div>
      ${items
        .map(
          (item) => `
            <div class="map-legend-row">
              <span class="map-legend-swatch" style="background:${item.color}"></span>
              <span class="map-legend-label">${item.label}</span>
            </div>`,
        )
        .join("")}
    `;
    return this._container;
  }

  onRemove() {
    this._container?.remove();
    this._container = null;
  }
}

function initPreviewMap() {
  const mapEl = document.getElementById("map-preview");
  if (!mapEl) return;

  previewMap = new maplibregl.Map({
    container: mapEl,
    style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
    center: [VANCOUVER.lng, VANCOUVER.lat],
    zoom: 13,
  });

  previewMap.addControl(new maplibregl.NavigationControl(), "top-right");
  previewMap.addControl(new MapLegendControl(), "bottom-left");

  previewMap.on("load", async () => {
    await initRestaurantPins(previewMap);
    runUrlSearch();
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;
        userLocation = { lng: longitude, lat: latitude };

        previewMap.setCenter([longitude, latitude]);

        new maplibregl.Marker({ color: "#2563eb" })
          .setLngLat([longitude, latitude])
          .setPopup(new maplibregl.Popup().setText("You are here"))
          .addTo(previewMap);

        await initRestaurantPins(previewMap);
        runUrlSearch();
      },
      () => {
        console.log("Location denied, showing Vancouver");
      },
    );
  }
}

async function fetchRestaurantsFromYelp() {
  const restaurants = [];

  for (let offset = 0; offset < 100; offset += 50) {
    const params = new URLSearchParams({
      latitude: VANCOUVER.lat,
      longitude: VANCOUVER.lng,
      categories: "restaurants",
      limit: "50",
      offset: String(offset),
    });

    const response = await fetch(`/api/yelp/businesses/search?${params}`);
    if (!response.ok) {
      console.error("Yelp API error:", response.status);
      break;
    }

    const data = await response.json();
    if (data.businesses) restaurants.push(...data.businesses);
    if (!data.businesses || data.businesses.length < 50) break;
  }

  return restaurants;
}

const SEED_FLAG_KEY = "restaurantsSeeded";

async function seedRestaurants() {
  if (localStorage.getItem(SEED_FLAG_KEY) === "true") return;

  const restaurantsRef = collection(db, "restaurants");
  const querySnapshot = await getDocs(restaurantsRef);

  if (!querySnapshot.empty) {
    localStorage.setItem(SEED_FLAG_KEY, "true");
    return;
  }

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

  localStorage.setItem(SEED_FLAG_KEY, "true");
}

function getOpenText(data) {
  if (data.hours && data.hours.trim() !== "") return data.hours;
  return "Hours not available";
}

function getDistanceText(data) {
  if (!userLocation || !data.lat || !data.lng) return "📍 Nearby";

  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    parseFloat(data.lat),
    parseFloat(data.lng),
  );

  return `📍 ${distance.toFixed(1)} km`;
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
        onerror="this.onerror=null;this.src='${getDefaultRestaurantImage()}';"
      />

      <div class="restaurant-popup-body">
        <h3 class="restaurant-popup-title">
          ${escapeHTML(data.name || "Unknown Restaurant")}
        </h3>

        <p class="restaurant-popup-cuisine">
          ${escapeHTML(
            data.cuisine
              ? data.cuisine.charAt(0).toUpperCase() + data.cuisine.slice(1)
              : "Restaurant",
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
          >
            ♡
          </button>
        </div>
      </div>
    </div>
  `;
}

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
      lastUpdated: new Date(),
    });

    if (previewMap) await initRestaurantPins(previewMap);
  } catch (error) {
    console.error("Error updating restaurant status:", error);
    alert("Could not update restaurant status.");
  }
}

function goToRestaurantPage(restaurantId) {
  const recentRestaurants =
    JSON.parse(localStorage.getItem("recentRestaurants")) || [];

  const updatedRecents = [
    restaurantId,
    ...recentRestaurants.filter((id) => id !== restaurantId),
  ].slice(0, 10);

  localStorage.setItem("recentRestaurants", JSON.stringify(updatedRecents));
  window.location.href = `/pages/restaurant-detail.html?id=${restaurantId}`;
}

async function toggleFavorite(buttonEl, restaurantID) {
  onAuthReady(async (user) => {
    if (!user) {
      alert("Please log in to save favorites.");
      return;
    }

    const userRef = doc(db, "users", user.uid);

    try {
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, { bookmarks: [restaurantID] });

        if (buttonEl) {
          buttonEl.classList.add("is-favorited");
          buttonEl.innerHTML = "♥";
        }
        return;
      }

      const bookmarks = userSnap.data()?.bookmarks || [];
      const isBookmarked = bookmarks.includes(restaurantID);

      if (isBookmarked) {
        await updateDoc(userRef, { bookmarks: arrayRemove(restaurantID) });

        if (buttonEl) {
          buttonEl.classList.remove("is-favorited");
          buttonEl.innerHTML = "♡";
        }
      } else {
        await updateDoc(userRef, { bookmarks: arrayUnion(restaurantID) });

        if (buttonEl) {
          buttonEl.classList.add("is-favorited");
          buttonEl.innerHTML = "♥";
        }
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

window.updateRestaurantStatus = updateRestaurantStatusById;
window.goToRestaurantPage = goToRestaurantPage;
window.toggleFavorite = toggleFavorite;
window.syncFavoriteButton = syncFavoriteButton;

window.addEventListener("load", initPreviewMap);
// Listen for restaurant search event from navbar
window.addEventListener("restaurant-search", async (e) => {
  const searchTerm = e.detail?.searchTerm?.toLowerCase().trim();
  if (!searchTerm || !previewMap || restaurantMarkers.length === 0) return;

  // Find the marker and its data by restaurant name (case-insensitive, partial match)
  // We'll need to fetch all restaurant docs to get their names and ids
  const snapshot = await getDocs(collection(db, "restaurants"));
  let found = null;
  let foundId = null;
  let foundLat = null;
  let foundLng = null;
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    if (
      data.name &&
      data.lat &&
      data.lng &&
      data.name.toLowerCase().includes(searchTerm)
    ) {
      found = data;
      foundId = docSnap.id;
      foundLat = parseFloat(data.lat);
      foundLng = parseFloat(data.lng);
    }
  });

  if (found && !Number.isNaN(foundLat) && !Number.isNaN(foundLng)) {
    // Find the marker for this restaurant
    const marker = restaurantMarkers.find((m) => {
      const lngLat = m.getLngLat();
      return (
        Math.abs(lngLat.lat - foundLat) < 0.0001 &&
        Math.abs(lngLat.lng - foundLng) < 0.0001
      );
    });
    if (marker) {
      previewMap.flyTo({ center: [foundLng, foundLat], zoom: 16 });
      setTimeout(() => {
        marker.togglePopup();
      }, 600); // Wait for flyTo animation
    }
  } else {
    alert("No restaurant found matching that name.");
  }
});
seedRestaurants();
