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
  if (data.imageSrc && data.imageSrc.trim() !== "") return data.imageSrc;
  return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";
}

function formatCuisine(cuisine = "") {
  if (!cuisine) return "Restaurant";
  return cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
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
            onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80';"
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