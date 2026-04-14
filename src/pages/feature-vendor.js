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
    const id = vendor.id; // get id from the vendor data (assuming it's stored as 'id' in Firebase)
    const statusInfo = normalizeStatus(vendor.status); // got color status

    // set up title and image
    const titleEl = card.querySelector(".card-title");
    const imageEl = card.querySelector(".card-image");

    if (titleEl) titleEl.textContent = vendor.name || "Unnamed Vendor";
    if (imageEl)
      imageEl.src =
        vendor.imageSrc || vendor.image_url || "/images/food-truck.jpg";

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

    // key: add the update status controls for each card,
    // and bind the onclick event to call the update function with the correct restaurant ID
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

    //  renderFilteredCards + button
    const actionButtons = document.createElement("div");
    actionButtons.className = "mt-3 d-flex gap-2 align-items-center";

    actionButtons.innerHTML = `
            <div class="restaurant-popup-actions">
          <button class="view-details-btn " onclick="window.goToRestaurantPage('${id}')">
            View Details

      `;

    card.querySelector(".card-body").appendChild(actionButtons);

    // --- turn the page to the restaurant detail page ---

    /**
     * turn the page to the restaurant detail page
     * @param {string} restaurantId
     */
    function goToRestaurantPage(restaurantId) {
      // 1. got the saved info from localStorage, if not exist, use an empty array as default
      const recentRestaurants =
        JSON.parse(localStorage.getItem("recentRestaurants")) || [];

      // 2. updtate the list: add the new restaurant ID to the front,
      // and remove any existing occurrence of it to avoid duplicates. limit 10
      const updatedRecents = [
        restaurantId,
        ...recentRestaurants.filter((id) => id !== restaurantId),
      ].slice(0, 10);

      // 3. updated information back to localStorage
      localStorage.setItem("recentRestaurants", JSON.stringify(updatedRecents));

      // 4. start turn and shows on  html
      window.location.href = `/pages/restaurant-detail.html?id=${restaurantId}`;
    }

    // key: shows on window onclick="window.goToRestaurantPage(...)" and make sue it can access the function
    window.goToRestaurantPage = goToRestaurantPage;

    // #2 section: favorite icon logic: we create a heart icon, and when clicked, it toggles the bookmark in Firebase for the current user
    // 1. Create the heart icon element
    const heartEl = document.createElement("i");
    heartEl.classList.add("material-icons", "fav-icon");
    heartEl.textContent = "♡";
    heartEl.style.cssText = "font-size: 36px; cursor: pointer; color: white;";

    // 2. Create a wrapper to push it to the bottom-right
    const heartWrapper = document.createElement("div");
    heartWrapper.classList.add("d-flex", "justify-content-end", "mt-2");
    heartWrapper.appendChild(heartEl);

    // 3. Attach it to the card body
    card.querySelector(".card-body").appendChild(heartWrapper);

    // 4. Make it interactive (Toggles red/filled on click)
    heartEl.addEventListener("click", async () => {
      const isFavorited = heartEl.textContent === "♥";

if (isFavorited) {
  // 1. Remove the class from the ELEMENTj
  heartEl.classList.remove("is-favorited"); 
  heartEl.textContent = "♡";
} else {
  // 2. Add the class to the ELEMENTj
  heartEl.classList.add("is-favorited");
  heartEl.textContent = "♥";
}      
      heartEl.style.color = isFavorited ? "white" : "red";

      const user = auth.currentUser;
      if (user) {
        await toggleBookmark(user.uid, id);
      } else {
        alert("Please login to save favorites");
      }
    });

    container.appendChild(card);
  });
}


async function toggleFavorite(buttonEl, restaurantID) {
  onAuthReady(async (user) => {
    if (!user) {
      alert("Please log in to save favorites.");
      return;
    }

    const userRef = doc(db, "users", user.uid);

    try {
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, { bookmarks: [restaurantID] });

        if (buttonEl) {
          buttonEl.classList.add("is-favorited");
          buttonEl.innerHTML = "♥";
        }
        return;
      }

      const bookmarks = userSnap.data()?.bookmarks || [];
      const isBookmarked = bookmarks.includes(restaurantID);

      if (isBookmarked) {
        await updateDoc(userRef, { bookmarks: arrayRemove(restaurantID) });

        if (buttonEl) {
          buttonEl.classList.remove("is-favorited");
          buttonEl.innerHTML = "♡";
        }
      } else {
        await updateDoc(userRef, { bookmarks: arrayUnion(restaurantID) });

        if (buttonEl) {
          buttonEl.classList.add("is-favorited");
          buttonEl.innerHTML = "♥";
        }
      }
    } catch (err) {
      console.error("Error updating favorite:", err);
      alert("Could not update favorites.");
    }
  });
}

async function syncFavoriteButton(restaurantID) {
  onAuthReady(async (user) => {
    if (!user) return;

    try {
      const buttonEl = document.getElementById(`favorite-btn-${restaurantID}`);
      if (!buttonEl) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        buttonEl.classList.remove("is-favorited");
        buttonEl.innerHTML = "♡";
        return;
      }

      const bookmarks = userSnap.data()?.bookmarks || [];
      const isBookmarked = bookmarks.includes(restaurantID);

      if (isBookmarked) {
        buttonEl.classList.add("is-favorited");
        buttonEl.innerHTML = "♥";
      } else {
        buttonEl.classList.remove("is-favorited");
        buttonEl.innerHTML = "♡";
      }
    } catch (error) {
      console.error("Error syncing favorite button:", error);
    }
  });
}

window.toggleFavorite = toggleFavorite;
window.syncFavoriteButton = syncFavoriteButton;

// #3 section:  filter the data base on the slected checkboxes.
async function loadFilters() {
  const filterContainer = document.getElementById("filter-container");
  const busynessContainer = document.getElementById("busyness-container");
  if (!filterContainer) return;

  try {
    // get data from firebase
    const querySnapshot = await getDocs(collection(db, "restaurants"));
    allVendorData = querySnapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .filter((v) => v.name); // only keep entries that have a name field

    // start rendering cards
    renderFilteredCards(allVendorData);

    //food types and busyness levels are both stored in the same collection, we can extract the unique values for both and create checkboxes for them.
    const descriptions = [
      ...new Set(
        allVendorData.map((v) => v.cuisine || v.vendor_type).filter((d) => d),
      ),
    ];
    // busyness
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

    // follow food type
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
  // collect the selected value from restuarnt card
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
    // collect the reference from firebase
    const restaurantRef = doc(db, "restaurants", restaurantId);

    // 2. refresh the status in firebase
    await updateDoc(restaurantRef, {
      status: newStatus,
      lastUpdated: new Date(), // record the update time
    });

    // 3. update badge color
    const badge = document.getElementById(`badge-${restaurantId}`);
    if (badge) {
      const statusInfo = normalizeStatus(newStatus);
      badge.className = `badge ${statusInfo.className} mt-2`;
      badge.textContent = `● ${statusInfo.label}`;
    }

    // 4. updated local cache, prevent old data from showing after filtering
    const idx = allVendorData.findIndex((v) => v.id === restaurantId);
    if (idx !== -1) {
      allVendorData[idx].status = newStatus;
    }
  } catch (error) {
    console.error("Firebase error:", error);
    alert("Update failed. Please check the console.");
  }
}

// move to window to make sure it can be accessed by the onclick event in the generated HTML
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

// favorited collection in user document: when user clicks the heart icon, we update the "favorited-restaurants" array field in the user's document in Firebase. If the restaurant ID is already in the array, we remove it (unfavorite); if it's not, we add it (favorite).
async function toggleBookmark(userId, vendorID) {
  const userRef = doc(db, "users", userId);
  try {
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() || {};
    const bookmarks = userData["favorited-restaurants"] || [];

    if (bookmarks.includes(vendorID)) {
      await updateDoc(userRef, {
        "favorited-restaurants": arrayRemove(vendorID),
      });
    } else {
      await updateDoc(userRef, {
        "favorited-restaurants": arrayUnion(vendorID),
      });
    }
  } catch (err) {
    console.error("Error toggling bookmark:", err);
  }
}

// once page is loaded, generate the restaurant cards, and load the filters
loadFilters();
