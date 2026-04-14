import { db, auth } from "/src/helper/firebaseConfig.js";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { onAuthReady } from "/src/helper/authentication.js";

// --- all vendor data ---
let allVendorData = [];
let selectedFoodTypes = [];
let selectedBusyness = [];
let favoriteRestaurantIds = [];

const STATUS_CONFIG = {
  empty: {
    label: "Empty",
    className: "bg-success",
    markerColor: "#22c55e",
  },
  busy: {
    label: "Busy",
    className: "bg-warning",
    markerColor: "#f59e0b",
  },
  full: {
    label: "Full",
    className: "bg-danger",
    markerColor: "#ef4444",
  },
};

function normalizeStatus(status = "") {
  const value = status.toString().trim().toLowerCase();
  if (value === "low" || value === "empty") return STATUS_CONFIG.empty;
  if (value === "medium" || value === "moderate" || value === "busy")
    return STATUS_CONFIG.busy;
  if (value === "high" || value === "full") return STATUS_CONFIG.full;
  return { label: "Unknown", className: "bg-secondary" };
}

async function getUserFavorites(userId) {
  const userRef = doc(db, "users", userId);

  try {
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() || {};
    const bookmarks = userData.bookmarks || [];
    const favoritedRestaurants = userData["favorited-restaurants"] || [];

    return [...new Set([...bookmarks, ...favoritedRestaurants])];
  } catch (err) {
    console.error("Error loading favorites:", err);
    return [];
  }
}

// 1. core render function: responsible for converting data into HTML cards
function renderFilteredCards(vendors) {
  const template = document.getElementById("vendorCardTemplate");
  const container = document.getElementById("Restaurants-go-here");
  if (!container || !template) return;

  container.innerHTML = "";

  if (vendors.length === 0) {
    container.innerHTML =
      '<div class="col-12"><p class="text-center">No vendors found.</p></div>';
    return;
  }

  // --- loop through each vendor ---
  vendors.forEach((vendor) => {
    const card = template.content.cloneNode(true);
    const id = vendor.id;
    const statusInfo = normalizeStatus(vendor.status);

    // set up title and image
    const titleEl = card.querySelector(".card-title");
    const imageEl = card.querySelector(".card-image");

    if (titleEl) titleEl.textContent = vendor.name || "Unnamed Vendor";
    if (imageEl) {
      imageEl.src =
        vendor.imageSrc || vendor.image_url || "/images/food-truck.jpg";
    }

    // change description with Badge
    const textEl = card.querySelector(".card-text");
    if (textEl) {
      textEl.innerHTML = `
        <strong>${vendor.cuisine || "Various"}</strong><br>
        ${vendor.address || vendor.location || "Vancouver"}<br>
        <span id="badge-${id}" class="badge ${statusInfo.className} mt-2">
          ● ${statusInfo.label}
        </span>
      `;
    }

    // key: add the update status controls for each card
    const updateControls = document.createElement("div");
    updateControls.className = "mt-3 d-flex gap-2";
    updateControls.innerHTML = `
      <select id="status-select-${id}" class="form-select form-select-sm">
        <option value="empty" ${vendor.status === "empty" ? "selected" : ""}>Empty</option>
        <option value="busy" ${vendor.status === "busy" ? "selected" : ""}>Busy</option>
        <option value="full" ${vendor.status === "full" ? "selected" : ""}>Full</option>
      </select>
      <button class="btn btn-sm btn-primary" onclick="window.updateRestaurantStatus('${id}')">
        Update
      </button>
    `;
    card.querySelector(".card-body").appendChild(updateControls);

    // view details button
    const actionButtons = document.createElement("div");
    actionButtons.className = "mt-3 d-flex gap-2 align-items-center";

    actionButtons.innerHTML = `
      <div class="restaurant-popup-actions">
        <button class="view-details-btn" onclick="window.goToRestaurantPage('${id}')">
          View Details
        </button>
      </div>
    `;

    card.querySelector(".card-body").appendChild(actionButtons);

    /**
     * turn the page to the restaurant detail page
     * @param {string} restaurantId
     */
    function goToRestaurantPage(restaurantId) {
      const recentRestaurants =
        JSON.parse(localStorage.getItem("recentRestaurants")) || [];

      const updatedRecents = [
        restaurantId,
        ...recentRestaurants.filter((id) => id !== restaurantId),
      ].slice(0, 10);

      localStorage.setItem("recentRestaurants", JSON.stringify(updatedRecents));
      window.location.href = `/pages/restaurant-detail.html?id=${restaurantId}`;
    }

    window.goToRestaurantPage = goToRestaurantPage;

    // favorite icon logic
    const isFavorited = favoriteRestaurantIds.includes(id);

    const heartEl = document.createElement("i");
    heartEl.classList.add("material-icons", "fav-icon");
    heartEl.textContent = isFavorited ? "♥" : "♡";
    heartEl.style.cssText = `font-size: 36px; cursor: pointer; color: ${
      isFavorited ? "red" : "white"
    };`;

    const heartWrapper = document.createElement("div");
    heartWrapper.classList.add("d-flex", "justify-content-end", "mt-2");
    heartWrapper.appendChild(heartEl);

    card.querySelector(".card-body").appendChild(heartWrapper);

    heartEl.addEventListener("click", async () => {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login to save favorites");
        return;
      }

      const currentlyFavorited = heartEl.textContent === "♥";

      heartEl.textContent = currentlyFavorited ? "♡" : "♥";
      heartEl.style.color = currentlyFavorited ? "white" : "red";

      await toggleBookmark(user.uid, id);

      if (currentlyFavorited) {
        favoriteRestaurantIds = favoriteRestaurantIds.filter(
          (favId) => favId !== id,
        );
      } else {
        favoriteRestaurantIds.push(id);
      }
    });

    container.appendChild(card);
  });
}

// #3 section: filter the data base on the selected checkboxes.
async function loadFilters() {
  const filterContainer = document.getElementById("filter-container");
  const busynessContainer = document.getElementById("busyness-container");
  if (!filterContainer) return;

  try {
    const querySnapshot = await getDocs(collection(db, "restaurants"));
    allVendorData = querySnapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .filter((v) => v.name);

    const user = auth.currentUser;
    if (user) {
      favoriteRestaurantIds = await getUserFavorites(user.uid);
    } else {
      favoriteRestaurantIds = [];
    }

    renderFilteredCards(allVendorData);

    const descriptions = [
      ...new Set(
        allVendorData.map((v) => v.cuisine || v.vendor_type).filter((d) => d),
      ),
    ];

    const busynessOptions = [
      ...new Set(allVendorData.map((v) => v.status).filter((b) => b)),
    ];

    filterContainer.innerHTML = "";
    busynessContainer.innerHTML = "";

    // ===== Food type dropdown =====
    descriptions.forEach((desc, index) => {
      filterContainer.innerHTML += `
        <li><div class="form-check">
          <input class="form-check-input food-filter-checkbox" type="checkbox" value="${desc}" id="food-${index}">
          <label class="form-check-label" for="food-${index}">${desc}</label>
        </div></li>`;
    });

    // ===== Busyness dropdown =====
    busynessOptions.forEach((busy, index) => {
      busynessContainer.innerHTML += `
        <li><div class="form-check">
          <input class="form-check-input busyness-filter-checkbox" type="checkbox" value="${busy}" id="busy-${index}">
          <label class="form-check-label" for="busy-${index}">${busy}</label>
        </div></li>`;
    });

    document
      .querySelectorAll(".food-filter-checkbox, .busyness-filter-checkbox")
      .forEach((cb) => {
        cb.addEventListener("change", handleCombinedFilter);
      });
  } catch (error) {
    console.error("EError loading data from Firebase:", error);
  }
}

// 1. update function: when user clicks the "Update" button.
async function updateRestaurantStatusById(restaurantId) {
  const select = document.getElementById(`status-select-${restaurantId}`);
  if (!select) {
    console.error(
      "Cannot find select element:",
      `status-select-${restaurantId}`,
    );
    return;
  }

  const newStatus = select.value;
  console.log("updating restaurant ID:", restaurantId, "to status:", newStatus);

  try {
    const restaurantRef = doc(db, "restaurants", restaurantId);

    await updateDoc(restaurantRef, {
      status: newStatus,
      lastUpdated: new Date(),
    });

    const badge = document.getElementById(`badge-${restaurantId}`);
    if (badge) {
      const statusInfo = normalizeStatus(newStatus);
      badge.className = `badge ${statusInfo.className} mt-2`;
      badge.textContent = `● ${statusInfo.label}`;
    }

    const idx = allVendorData.findIndex((v) => v.id === restaurantId);
    if (idx !== -1) {
      allVendorData[idx].status = newStatus;
    }
  } catch (error) {
    console.error("Firebase error:", error);
    alert("Update failed. Please check the console.");
  }
}

window.updateRestaurantStatus = updateRestaurantStatusById;

function handleCombinedFilter() {
  const checkedFood = document.querySelectorAll(
    ".food-filter-checkbox:checked",
  );
  const checkedBusyness = document.querySelectorAll(
    ".busyness-filter-checkbox:checked",
  );

  selectedFoodTypes = Array.from(checkedFood).map((cb) => cb.value);
  selectedBusyness = Array.from(checkedBusyness).map((cb) => cb.value);

  const filtered = allVendorData.filter((vendor) => {
    const matchesFood =
      selectedFoodTypes.length === 0 ||
      selectedFoodTypes.includes(vendor.cuisine || vendor.vendor_type);
    const matchesBusyness =
      selectedBusyness.length === 0 || selectedBusyness.includes(vendor.status);
    return matchesFood && matchesBusyness;
  });

  renderFilteredCards(filtered);
}

// save/remove favorite in both fields so home page and favorite page stay synced
async function toggleBookmark(userId, vendorID) {
  const userRef = doc(db, "users", userId);

  try {
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() || {};
    const bookmarks = userData.bookmarks || [];
    const favoritedRestaurants = userData["favorited-restaurants"] || [];

    const alreadySaved =
      bookmarks.includes(vendorID) || favoritedRestaurants.includes(vendorID);

    if (alreadySaved) {
      await updateDoc(userRef, {
        bookmarks: arrayRemove(vendorID),
        "favorited-restaurants": arrayRemove(vendorID),
      });
    } else {
      await updateDoc(userRef, {
        bookmarks: arrayUnion(vendorID),
        "favorited-restaurants": arrayUnion(vendorID),
      });
    }
  } catch (err) {
    console.error("Error toggling bookmark:", err);
  }
}

loadFilters();