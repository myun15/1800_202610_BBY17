import { db } from "../helper/firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";
import { onAuthReady } from "/src/helper/authentication.js";
import {
  formatCrowdStatus,
  getStatusClass,
  getRestaurantImage,
  getDefaultRestaurantImage,
  formatCuisine,
} from "../helper/utils.js";

// Fetches restaurant from restaurant collection from firebase and creates html vendor card templates
async function renderSavedRestaurants(userId) {
  const container =
    document.getElementById("Restaurants-go-here") ||
    document.getElementById("favoritesContainer");

  const template = document.getElementById("vendorCardTemplate");

  if (!container) return;

  container.innerHTML = "";

  try {
    const userRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userRef);

    if (!userDocSnap.exists()) {
      container.innerHTML = "<p class='text-center'>User not found.</p>";
      return;
    }

    const userData = userDocSnap.data() || {};
    const bookmarks = userData.bookmarks || [];
    const favoritedRestaurants = userData["favorited-restaurants"] || [];
    const allFavorites = [...new Set([...bookmarks, ...favoritedRestaurants])];

    if (bookmarks.length === 0) {
      container.innerHTML =
        "<p class='text-center'>No favorite restaurants yet!</p>";
      return;
    }

    for (const restaurantId of allFavorites) {
      const restRef = doc(db, "restaurants", restaurantId);
      const restDoc = await getDoc(restRef);

      if (!restDoc.exists()) continue;

      const data = restDoc.data();
      const mergedData = {
        id: restDoc.id,
        ...data,
      };

      if (template) {
        const card = template.content.cloneNode(true);

        const titleEl = card.querySelector(".card-title");
        const categoryEl = card.querySelector(".category-text");
        const addressEl = card.querySelector(".address-text");
        const badgeEl = card.querySelector(".status-badge");
        const imageEl = card.querySelector(".vendor-img");
        const clickableCard =
          card.querySelector(".vendor-card") ||
          card.querySelector(".card") ||
          card.querySelector(".favorite-card");

        if (titleEl) {
          titleEl.innerText = mergedData.name || "Unknown Restaurant";
        }

        if (categoryEl) {
          categoryEl.innerText = formatCuisine(mergedData.cuisine);
        }

        if (addressEl) {
          addressEl.innerText = mergedData.address || "Address not available";
        }

        if (badgeEl) {
          badgeEl.innerText = formatCrowdStatus(mergedData.status);
          badgeEl.className = `status-badge badge rounded-pill px-3 ${getStatusClass(
            mergedData.status,
          )}`;
        }

        if (imageEl) {
          imageEl.src = getRestaurantImage(mergedData);
          imageEl.alt = mergedData.name || "Restaurant image";
          imageEl.onerror = () => {
            imageEl.src = getDefaultRestaurantImage();
          };
        }

        const target = clickableCard || card.firstElementChild;
        if (target) {
          target.style.cursor = "pointer";
          target.addEventListener("click", () => {
            window.location.href = `restaurant-detail.html?id=${mergedData.id}`;
          });
        }

        container.appendChild(card);
      } else {
        const cardHTML = `
  <div class="favorite-card" onclick="window.location.href='restaurant-detail.html?id=${mergedData.id}'">
    <img
      class="favorite-card-image"
      src="${getRestaurantImage(mergedData)}"
      alt="${mergedData.name || "Restaurant image"}"
      onerror="this.onerror=null;this.src='${getDefaultRestaurantImage()}';"
    />

    <div class="favorite-card-body">
      <h3 class="favorite-card-title">${mergedData.name || "Unknown Restaurant"}</h3>
      <p class="favorite-card-cuisine">${formatCuisine(mergedData.cuisine)}</p>
      <p class="favorite-card-address">${mergedData.address || "Address not available"}</p>

      <div class="favorite-card-footer">
        ${
          mergedData.rating != null
            ? `<span class="favorite-rating">⭐ ${mergedData.rating}</span>`
            : `<span></span>`
        }
        <span class="status-badge ${getStatusClass(mergedData.status)}">
          ${formatCrowdStatus(mergedData.status)}
        </span>
      </div>
    </div>
  </div>
`;

        container.insertAdjacentHTML("beforeend", cardHTML);
      }
    }

    if (container.innerHTML.trim() === "") {
      container.innerHTML =
        "<p class='text-center'>No favorite restaurants found.</p>";
    }
  } catch (error) {
    console.error("Error loading favorites:", error);
    container.innerHTML =
      "<p class='text-center'>Error loading your favorites.</p>";
  }
}

onAuthReady((user) => {
  const container =
    document.getElementById("Restaurants-go-here") ||
    document.getElementById("favoritesContainer");

  if (!container) return;

  if (!user) {
    container.innerHTML =
      "<p class='text-center'>Please log in to view your favorites.</p>";
    return;
  }

  renderSavedRestaurants(user.uid);
});

export { renderSavedRestaurants };
