import { db } from "./helper/firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

// Get the document ID from the URL
function getDocIdFromUrl() {
  const params = new URL(window.location.href).searchParams;
  return params.get("docID");
}

// Fetch the restaurant and display its details
async function displayRestaurantInfo() {
  const id = getDocIdFromUrl();

  if (!id) {
    console.error("No document ID provided");
    const nameElement = document.getElementById("restaurantName");
    if (nameElement) nameElement.textContent = "No restaurant selected";
    return;
  }

  try {
    // show loading state
    document.getElementById("restaurantName").textContent = "Loading...";

    const restaurantRef = doc(db, "restaurants", id);
    const restaurantSnap = await getDoc(restaurantRef);

    if (!restaurantSnap.exists()) {
      document.getElementById("restaurantName").textContent =
        "Restaurant not found";
      return;
    }

    const restaurant = restaurantSnap.data();

    // Update page title
    document.title = `${restaurant.name} - TeamBBY`;

    // Update restaurant name
    const nameElement = document.getElementById("restaurantName");
    if (nameElement) nameElement.textContent = restaurant.name;

    // Set image
    const img = document.getElementById("restaurantImage");
    if (img) {
      img.src = restaurant.imageSrc || "/images/food-truck.jpg";
      img.alt = restaurant.name;

      img.onerror = () => {
        img.src = "/images/food-truck.jpg";
      };
    }

    // Display all restaurant details
    const detailsContainer = document.getElementById("restaurantDetails");
    if (detailsContainer) {
      detailsContainer.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Restaurant Information</h5>
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item">
                                <strong>Cuisine:</strong> ${restaurant.cuisine || restaurant.description || "Various"}
                            </li>
                            <li class="list-group-item">
                                <strong>Location:</strong> ${restaurant.geo_localarea || "Vancouver"}
                            </li>
                            <li class="list-group-item">
                                <strong>Address:</strong> ${restaurant.location || "N/A"}
                            </li>
                            <li class="list-group-item">
                                <strong>Status:</strong> 
                                <span class="badge ${restaurant.status === "open" ? "bg-success" : "bg-secondary"}">
                                    ${restaurant.status === "open" ? "Open" : "Closed"}
                                </span>
                            </li>
                            ${
                              restaurant.rating
                                ? `
                            <li class="list-group-item">
                                <strong>Rating:</strong> ⭐ ${restaurant.rating} / 5
                            </li>
                            `
                                : ""
                            }
                            <li class="list-group-item">
                                <strong>Details:</strong> ${restaurant.description || "No additional details available"}
                            </li>
                            ${
                              restaurant.lat && restaurant.lng
                                ? `
                            <li class="list-group-item">
                                <strong>Location Coordinates:</strong><br>
                                Lat: ${restaurant.lat}<br>
                                Lng: ${restaurant.lng}
                            </li>
                            `
                                : ""
                            }
                            <li class="list-group-item">
                                <strong>Vendor Code:</strong> ${restaurant.key || "N/A"}
                            </li>
                        </ul>
                    </div>
                </div>
            `;
    }
  } catch (error) {
    console.error("Error loading restaurant:", error);
    document.getElementById("restaurantName").textContent =
      "Error loading restaurant.";
    const detailsContainer = document.getElementById("restaurantDetails");
    if (detailsContainer) {
      detailsContainer.innerHTML =
        '<div class="alert alert-danger">Failed to load restaurant details. Please try again later.</div>';
    }
  }
}

// ensure the function runs after the DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", displayRestaurantInfo);
} else {
  displayRestaurantInfo();
}

export { displayRestaurantInfo };
