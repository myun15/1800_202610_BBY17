import { db } from "../helper/firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

function getDocIdFromUrl() {
  const params = new URL(window.location.href).searchParams;
  return params.get("id");
}

function formatCrowdStatus(status = "") {
  const value = status.toString().trim().toLowerCase();

  if (value === "empty" || value === "low") return "Empty";
  if (value === "busy" || value === "medium" || value === "moderate")
    return "Busy";
  if (value === "full" || value === "high") return "Full";

  return "No update yet";
}

function getStatusBadge(status = "") {
  const value = status.toString().trim().toLowerCase();

  if (value === "empty" || value === "low") {
    return `<span class="badge bg-success">Empty</span>`;
  }

  if (value === "busy" || value === "medium" || value === "moderate") {
    return `<span class="badge bg-warning text-dark">Busy</span>`;
  }

  if (value === "full" || value === "high") {
    return `<span class="badge bg-danger">Full</span>`;
  }

  return `<span class="badge bg-secondary">No update yet</span>`;
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

function formatCuisine(cuisine = "") {
  if (!cuisine) return "Restaurant";
  return cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
}

async function displayRestaurantInfo() {
  const id = getDocIdFromUrl();

  const nameElement = document.getElementById("restaurantName");
  const metaElement = document.getElementById("restaurantMeta");
  const statusElement = document.getElementById("restaurantStatus");
  const detailsContainer = document.getElementById("restaurantDetails");
  const img = document.getElementById("restaurantImage");

  if (!id) {
    if (nameElement) nameElement.textContent = "No restaurant selected";
    if (detailsContainer) {
      detailsContainer.innerHTML =
        '<p class="text-center">No restaurant ID was provided.</p>';
    }
    return;
  }

  try {
    if (nameElement) nameElement.textContent = "Loading...";

    const restaurantRef = doc(db, "restaurants", id);
    const restaurantSnap = await getDoc(restaurantRef);

    if (!restaurantSnap.exists()) {
      if (nameElement) nameElement.textContent = "Restaurant not found";
      if (detailsContainer) {
        detailsContainer.innerHTML =
          '<p class="text-center">This restaurant could not be found.</p>';
      }
      return;
    }

    const restaurant = restaurantSnap.data();

    document.title = `${restaurant.name || "Restaurant"} - TeamBBY`;

    if (nameElement) {
      nameElement.textContent = restaurant.name || "Unknown Restaurant";
    }

    if (metaElement) {
      metaElement.textContent = `${formatCuisine(restaurant.cuisine)} • ${restaurant.city || "Vancouver"}`;
    }

    if (statusElement) {
      statusElement.innerHTML = `
        ${getStatusBadge(restaurant.status)}
        <span class="ms-2 text-muted">Updated ${formatTimeAgo(restaurant.lastUpdated)}</span>
      `;
    }

    if (img) {
      img.src =
        restaurant.imageSrc && restaurant.imageSrc.trim() !== ""
          ? restaurant.imageSrc
          : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";

      img.alt = restaurant.name || "Restaurant image";

      img.onerror = () => {
        img.src =
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";
      };
    }

    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <div class="card shadow-sm border-0 rounded-4 vendor-detail-card">
          <div class="card-body p-4">
            <h5 class="mb-3">Restaurant Information</h5>

            <div class="mb-3">
              <strong>Address:</strong><br>
              ${restaurant.address || "Address not available"}
            </div>

            <div class="mb-3">
              <strong>City:</strong><br>
              ${restaurant.city || "Vancouver"}
            </div>

            <div class="mb-3">
              <strong>Cuisine:</strong><br>
              ${formatCuisine(restaurant.cuisine)}
            </div>

            ${
              restaurant.rating != null
                ? `
            <div class="mb-3">
              <strong>Rating:</strong><br>
              ⭐ ${restaurant.rating} / 5
            </div>
            `
                : ""
            }

            <div class="mb-3">
              <strong>Crowd Status:</strong><br>
              ${getStatusBadge(restaurant.status)}
            </div>

            <div class="mb-0">
              <strong>Updated:</strong><br>
              ${formatTimeAgo(restaurant.lastUpdated)}
            </div>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error loading restaurant:", error);

    if (nameElement) nameElement.textContent = "Error loading restaurant";
    if (detailsContainer) {
      detailsContainer.innerHTML =
        '<p class="text-center">Failed to load restaurant details.</p>';
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", displayRestaurantInfo);
} else {
  displayRestaurantInfo();
}
