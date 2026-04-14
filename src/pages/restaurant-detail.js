import { db } from "../helper/firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";
import {
  getStatusBadge,
  getRestaurantImage,
  getDefaultRestaurantImage,
  formatCuisine,
  formatTimeAgo,
} from "../helper/utils.js";

function getDocIdFromUrl() {
  const params = new URL(window.location.href).searchParams;
  return params.get("id");
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
      img.src = getRestaurantImage(restaurant);
      img.alt = restaurant.name || "Restaurant image";
      img.onerror = () => {
        img.src = getDefaultRestaurantImage();
      };
    }

    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <div class="card shadow-sm border-0 rounded-4 restaurant-detail-card">
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
