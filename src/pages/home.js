import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "/src/helper/firebaseConfig.js";
import { onAuthReady } from "/src/helper/authentication.js";

// --- Map Preview ---
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const VANCOUVER = { lng: -123.1207, lat: 49.2827 };

function initPreviewMap() {
  const mapEl = document.getElementById("map-preview");
  if (!mapEl) return;

  const map = new maplibregl.Map({
    container: mapEl,
    style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
    center: [VANCOUVER.lng, VANCOUVER.lat],
    zoom: 13,
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");

  map.on("load", () => {
    initRestaurantPins(map);
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        map.setCenter([longitude, latitude]);

        new maplibregl.Marker({ color: "#ff0000" })
          .setLngLat([longitude, latitude])
          .setPopup(new maplibregl.Popup().setText("You are here"))
          .addTo(map);
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
      cuisine:
        (place.categories || []).map((c) => c.title).join(", ") || "",
      lat: String(place.coordinates?.latitude || ""),
      lng: String(place.coordinates?.longitude || ""),
      imageSrc: place.image_url || "",
    });
  }

  console.log(`Seeded ${places.length} restaurants from Yelp.`);
}

async function initRestaurantPins(map) {
  const snapshot = await getDocs(collection(db, "restaurants"));

  snapshot.docs.forEach((doc) => {
    const data = doc.data();

    if (data.lat && data.lng) {
      new maplibregl.Marker({ color: "#ff0000" })
        .setLngLat([parseFloat(data.lng), parseFloat(data.lat)])

        .setPopup(
          new maplibregl.Popup().setHTML(`
    <h3>${data.name}</h3>
    <p>${data.address || ""}</p>
    <p>
      ${data.status === "empty"
              ? "🟢 EMPTY"
              : data.status === "busy"
                ? "🟡 BUSY"
                : data.status === "full"
                  ? "🔴 FULL"
                  : "⚪ UNKNOWN"
            }
    </p>
  `)
        )
        .addTo(map);
    }
  });
}

window.addEventListener("load", initPreviewMap);
showNameWhenLoggedIn();
seedRestaurants();
