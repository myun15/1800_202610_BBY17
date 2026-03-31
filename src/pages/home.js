import { collection, getDocs, addDoc, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
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

// --- Restaurant Seeding from OpenStreetMap ---
async function fetchRestaurantsFromOverpass() {
  const query = `
    [out:json][timeout:30];
    node["amenity"="restaurant"](49.20,-123.27,49.32,-123.02);
    out body 100;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!response.ok) {
    console.error("Overpass API error:", response.status);
    return [];
  }

  const data = await response.json();
  return data.elements || [];
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

  console.log("Seeding restaurants from OpenStreetMap...");
  const places = await fetchRestaurantsFromOverpass();

  for (const place of places) {
    const tags = place.tags || {};
    await addDoc(restaurantsRef, {
      name: tags.name || "Unknown Restaurant",
      address:
        [tags["addr:street"], tags["addr:housenumber"]]
          .filter(Boolean)
          .join(" ") || "",
      city: "Vancouver",
      cuisine: tags.cuisine || "",
      lat: String(place.lat || ""),
      lng: String(place.lon || ""),
      imageSrc: "",
    });
  }

  console.log(`Seeded ${places.length} restaurants from OpenStreetMap.`);
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
            <div style="text-align: right;">
                <i class="material-icons" 
                   style="cursor:pointer; font-size: 24px;" 
                   onclick="toggleFavorite('${doc.id}')">
                   favorite_border
                </i>
            </div>
          `)
        )
        .addTo(map);
    }
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

// Make it globally accessible for the button in the popup
window.toggleFavorite = toggleFavorite;