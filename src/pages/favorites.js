import { collection, getDocs } from "firebase/firestore";
import { db } from "/src/helper/firebaseConfig.js";

async function collectionToJSON(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function createRestaurantsFavorites() {
  const restaurants = await collectionToJSON("restaurants");
  const restaurantsEl = document.getElementById("restaurants");

  if (!restaurants || !restaurantsEl) return;

<<<<<<< Updated upstream
  for (const restaurant of restaurants) {
    const li = document.createElement("li");
    li.textContent = restaurant.name;
=======
  return "crowd-unknown";
}

function getRestaurantImage(data) {
  const defaultImage =
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";
>>>>>>> Stashed changes

    const img = document.createElement("img");
    img.src = restaurant.imageSrc;
    img.alt = restaurant.name;
    img.addEventListener("click", () => {
      window.location.href = "review.html";
    });

<<<<<<< Updated upstream
    li.appendChild(img);
    restaurantsEl.appendChild(li);
=======
  return defaultImage;
}

function formatCuisine(cuisine = "") {
  if (!cuisine) return "Restaurant";
  return cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
}

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

    if (allFavorites.length === 0) {
      container.innerHTML = "<p class='text-center'>No favorite restaurants yet!</p>";
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
            mergedData.status
          )}`;
        }

        if (imageEl) {
          imageEl.src = getRestaurantImage(mergedData);
          imageEl.alt = mergedData.name || "Restaurant image";
          imageEl.onerror = () => {
            imageEl.src =
              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";
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
        // Fallback if no template exists
        const cardHTML = `
  <div class="favorite-card" onclick="window.location.href='restaurant-detail.html?id=${mergedData.id}'">
    <img
      class="favorite-card-image"
      src="${getRestaurantImage(mergedData)}"
      alt="${mergedData.name || "Restaurant image"}"
      onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80';"
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
      container.innerHTML = "<p class='text-center'>No favorite restaurants found.</p>";
    }
  } catch (error) {
    console.error("Error loading favorites:", error);
    container.innerHTML = "<p class='text-center'>Error loading your favorites.</p>";
>>>>>>> Stashed changes
  }
}

createRestaurantsFavorites();
