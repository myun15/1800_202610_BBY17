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

  map.on("load", () => {
    initRestaurantPins(map);
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

        // refresh markers so popup distance uses real user location
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
  const restaurants = [];

  // Yelp returns max 50 per call, so paginate to get ~100
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
    if (data.businesses) {
      restaurants.push(...data.businesses);
    }
    if (!data.businesses || data.businesses.length < 50) break;
  }

  return restaurants;
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

  if (value === "empty" || value === "low") {
    return { label: "Low", emoji: "🟢", className: "crowd-low" };
  }

  if (value === "busy" || value === "medium" || value === "moderate") {
    return { label: "Busy", emoji: "🟡", className: "crowd-medium" };
  }

  if (value === "full" || value === "high") {
    return { label: "Full", emoji: "🔴", className: "crowd-high" };
  }

  return { label: "Unknown", emoji: "⚪", className: "crowd-unknown" };
}

function getRestaurantImage(data) {
  if (data.imageSrc && data.imageSrc.trim() !== "") {
    return data.imageSrc;
  }

  return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";
}

function getOpenText(data) {
  if (data.hours && data.hours.trim() !== "") {
    return data.hours;
  }

  return "Hours not available";
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km

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

function buildPopupHTML(data) {
  const status = normalizeStatus(data.status);
  const image = getRestaurantImage(data);
  const openText = getOpenText(data);
  const distanceText = getDistanceText(data);

  return `
    <div class="restaurant-popup-card">
      <img
        class="restaurant-popup-image"
        src="${escapeHTML(image)}"
        alt="${escapeHTML(data.name || "Restaurant image")}"
      />

      <div class="restaurant-popup-body">
        <h3 class="restaurant-popup-title">
          ${escapeHTML(data.name || "Unknown Restaurant")}
        </h3>

        <p class="restaurant-popup-cuisine">
          ${escapeHTML(data.cuisine || "Restaurant")}
        </p>

        <p class="restaurant-popup-address">
          ${escapeHTML(data.address || "Address not available")}
        </p>

        <div class="restaurant-popup-meta">
          <span>${data.rating ? `⭐ ${escapeHTML(data.rating)}` : "⭐ N/A"}</span>
          <span>${distanceText}</span>
        </div>

        <div class="restaurant-popup-meta">
          <span>${escapeHTML(openText)}</span>
        </div>

        <div class="restaurant-popup-badge ${status.className}">
          ${status.emoji} ${status.label}
        </div>
      </div>
    </div>
  `;
}

// --- Restaurant Pins ---
async function initRestaurantPins(map) {
  const snapshot = await getDocs(collection(db, "restaurants"));

  snapshot.docs.forEach((doc) => {
    const data = doc.data();

    if (!data.lat || !data.lng) return;

    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: "300px",
      offset: 25,
    }).setHTML(buildPopupHTML(data));

    new maplibregl.Marker({ color: "#ff0000" })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map);
  });
}

window.addEventListener("load", initPreviewMap);
showNameWhenLoggedIn();
seedRestaurants();

// --- Favorite Toggle Logic (Demo #12) ---
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
    }
  });
}
