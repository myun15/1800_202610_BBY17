import { db } from "../helper/firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";
import {
  formatCrowdStatus,
  getStatusClass,
  getRestaurantImage,
  getDefaultRestaurantImage,
  formatCuisine,
  formatTimeAgo,
} from "../helper/utils.js";

async function loadRecentRestaurants() {
  const container = document.getElementById("recentRestaurantsContainer");
  if (!container) return;

  const recentIds = JSON.parse(localStorage.getItem("recentRestaurants")) || [];

  if (recentIds.length === 0) {
    container.innerHTML = `<p>No recently viewed restaurants yet.</p>`;
    return;
  }

  const restaurants = [];

  for (const id of recentIds) {
    try {
      const snap = await getDoc(doc(db, "restaurants", id));
      if (snap.exists()) restaurants.push({ id: snap.id, ...snap.data() });
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
            onerror="this.onerror=null;this.src='${getDefaultRestaurantImage()}';"
          />

          <div class="recent-card-body">
            <h3 class="recent-card-title">${restaurant.name || "Unknown Restaurant"}</h3>
            <p class="recent-card-cuisine">${formatCuisine(restaurant.cuisine)}</p>
            <p class="recent-card-address">${restaurant.address || "Address not available"}</p>

            <div class="recent-card-footer">
              ${
                restaurant.rating != null
                  ? `<span class="recent-rating">⭐ ${restaurant.rating}</span>`
                  : `<span></span>`
              }
              <span class="restaurant-popup-badge ${getStatusClass(restaurant.status)}">
                ${formatCrowdStatus(restaurant.status)}
              </span>
            </div>

            <p class="recent-card-updated">
              Updated ${formatTimeAgo(restaurant.lastUpdated)}
            </p>
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