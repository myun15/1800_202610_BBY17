import { db } from "../helper/firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

function formatCrowdStatus(status = "") {
  const value = status.toString().trim().toLowerCase();

  if (value === "empty" || value === "low") return "Empty";
  if (value === "busy" || value === "medium" || value === "moderate") return "Busy";
  if (value === "full" || value === "high") return "Full";

  return "No update yet";
}

function getStatusClass(status = "") {
  const value = status.toString().trim().toLowerCase();

  if (value === "empty" || value === "low") return "crowd-empty";
  if (value === "busy" || value === "medium" || value === "moderate") return "crowd-busy";
  if (value === "full" || value === "high") return "crowd-full";

  return "crowd-unknown";
}

function getRestaurantImage(data) {
  if (data.imageSrc && data.imageSrc.trim() !== "") {
    return data.imageSrc;
  }

  return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";
}

function formatCuisine(cuisine = "") {
  if (!cuisine) return "Restaurant";
  return cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
}

async function loadRecentRestaurants() {
  const container = document.getElementById("recentRestaurantsContainer");
  if (!container) return;

  const recentIds = JSON.parse(localStorage.getItem("recentRestaurants")) || [];
  console.log("Recent IDs:", recentIds);

  if (recentIds.length === 0) {
    container.innerHTML = `<p>No recently viewed restaurants yet.</p>`;
    return;
  }

  const restaurants = [];

  for (const id of recentIds) {
    try {
      const snap = await getDoc(doc(db, "restaurants", id));
      if (snap.exists()) {
        restaurants.push({ id: snap.id, ...snap.data() });
      }
    } catch (error) {
      console.error("Error loading recent restaurant:", error);
    }
  }

  if (restaurants.length === 0) {
    container.innerHTML = `<p>No recent restaurants found.</p>`;
    return;
  }

  container.innerHTML = restaurants
    .map(
      (restaurant) => `
        <div class="recent-card" onclick="window.location.href='restaurant-detail.html?id=${restaurant.id}'">
          <img
            class="recent-card-image"
            src="${getRestaurantImage(restaurant)}"
            alt="${restaurant.name || "Restaurant image"}"
          />

          <div class="recent-card-body">
            <h3 class="recent-card-title">${restaurant.name || "Unknown Restaurant"}</h3>
            <p class="recent-card-cuisine">${formatCuisine(restaurant.cuisine)}</p>
<p class="recent-card-address">${restaurant.location || "Location not available"}</p>
            <div class="recent-card-footer">
              ${restaurant.rating != null ? `<span>⭐ ${restaurant.rating}</span>` : `<span></span>`}
              <span class="restaurant-popup-badge ${getStatusClass(restaurant.status)}">
                ${formatCrowdStatus(restaurant.status)}
              </span>
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadRecentRestaurants);
} else {
  loadRecentRestaurants();
}