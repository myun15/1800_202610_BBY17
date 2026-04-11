import { auth, db } from "../helper/firebaseConfig.js";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

async function displayVendorCards() {
  const template = document.getElementById("vendorCardTemplate"); // Blueprint for restaurant cards
  const container = document.getElementById("Restaurants-go-here"); // Actual <div> that the restaurant cards are appended to

  if (!container || !template) {
    console.error("Missing container or template element");
    return;
  }

  try {
    // Get restaurant data from /public/data/food-vendors.json
    const response = await fetch("/data/food-vendors.json");

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const vendors = await response.json();

    const validVendors = vendors.filter((v) => v.business_name); // Retrieve only vendors with a business name
    if (validVendors.length === 0) {
      container.innerHTML =
        '<div class="col-12"><p class="text-center">No vendors found.</p></div>';
      return;
    }

    // Create a restaurant card for each restaurant
    validVendors.forEach((vendor) => {
      const card = template.content.cloneNode(true);
      const vendorID = vendor.id || null;

      card.querySelector(".card-image").src = vendor.image_url;
      card.querySelector(".card-image").alt = vendor.business_name;
      card.querySelector(".card-title").textContent = vendor.business_name;
      card.querySelector(".card-text").innerHTML = `
                      <strong>${vendor.description || "Various"}</strong><br>
                      ${vendor.location}<br>
                      <span class="badge ${vendor.status === "open" ? "bg-success" : "bg-secondary"} mt-2">
                          ${vendor.status === "open" ? "● Open" : "● Closed"}
                      </span>
                      <p class="text-muted small mt-2">📍 ${vendor.geo_localarea || "Vancouver"}</p>
                      <span class="fw-semibold">Busyness:</span> ${vendor.busyness || "no data"}<br>
                  `;

      const heartEl = document.createElement("i");
      heartEl.classList.add("material-icons", "fav-icon");
      heartEl.textContent = "♡";
      heartEl.style.cssText = "font-size: 36px; cursor: pointer; color: white;";

      const heartWrapper = document.createElement("div");
      heartWrapper.classList.add("d-flex", "justify-content-end", "mt-2");
      heartWrapper.appendChild(heartEl);

      card.querySelector(".card-body").appendChild(heartWrapper);

      // 4. Make it interactive (Toggles red/filled on click)
      heartEl.addEventListener("click", async () => {
        const isFavorited = heartEl.textContent === "♥";
        heartEl.textContent = isFavorited ? "♡" : "♥";
        heartEl.style.color = isFavorited ? "white" : "red";

        const user = auth.currentUser;
        if (user) {
          await toggleBookmark(user.uid, vendorID);
        } else {
          console.log("Login to save favorites");
        }
      });

      container.appendChild(card);
    });

    console.log(`Displayed ${validVendors.length} vendors`);
  } catch (error) {
    console.error("Error loading vendors:", error);
    container.innerHTML =
      '<div class="col-12"><p class="text-center text-danger">Error loading vendors. Please refresh the page.</p></div>';
  }
}

async function toggleBookmark(userId, vendorID) {
  if (!db) {
    console.error("Database (db) is not defined! Check your imports.");
    return;
  }

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data() || {};
  const bookmarks = userData["favorited-restaurants"] || [];

  const isBookmarked = bookmarks.includes(vendorID);

  console.log()

  try {
    if (isBookmarked) {
      await updateDoc(userRef, {
        "favorited-restaurants": arrayRemove(vendorID),
      });
    } else {
      await updateDoc(userRef, {
        "favorited-restaurants": arrayUnion(vendorID),
      });
    }
  } catch (err) {
    console.error("Error toggling bookmarkj:", err);
  }
}

displayVendorCards();

let allVendorData = [];
let selectedFoodTypes = [];
let selectedBusyness = [];

async function loadFilters() {
  const filterContainer = document.getElementById("filter-container");
  const busynessContainer = document.getElementById("busyness-container");

  if (!filterContainer) {
    console.error("Missing #filter-container");
    return;
  }

  try {
    const response = await fetch("/data/food-vendors.json");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const vendors = await response.json();
    allVendorData = vendors.filter((v) => v.business_name);
    renderFilteredCards(allVendorData);
    //food types
    const descriptions = [
      ...new Set(
        allVendorData
          .map((v) => v.description)
          .filter((d) => d && d.trim() !== ""),
      ),
    ];
    // busyness
    const busynessOptions = [
      ...new Set(
        allVendorData
          .map((v) => v.busyness)
          .filter((b) => b && b.trim() !== ""),
      ),
    ];
    filterContainer.innerHTML = "";
    busynessContainer.innerHTML = "";

    // ===== Food type dropdown =====
    descriptions.forEach((desc, index) => {
      const item = document.createElement("li");
      item.innerHTML = `
        <div class="form-check">
          <input class="form-check-input food-filter-checkbox" type="checkbox" value="${desc}" id="food-filter-${index}">
          <label class="form-check-label" for="food-filter-${index}">${desc}</label>
        </div>
      `;
      filterContainer.appendChild(item);
    });

    // ===== Busyness dropdown =====
    busynessOptions.forEach((busy, index) => {
      const item = document.createElement("li");
      item.innerHTML = `
        <div class="form-check">
          <input class="form-check-input busyness-filter-checkbox" type="checkbox" value="${busy}" id="busyness-filter-${index}">
          <label class="form-check-label" for="busyness-filter-${index}">${busy}</label>
        </div>
      `;
      busynessContainer.appendChild(item);
    });

    // follow food type
    const foodCheckboxes = document.querySelectorAll(".food-filter-checkbox");
    foodCheckboxes.forEach((cb) => {
      cb.addEventListener("change", handleCombinedFilter);
    });

    // follow busyness
    const busynessCheckboxes = document.querySelectorAll(
      ".busyness-filter-checkbox",
    );
    busynessCheckboxes.forEach((cb) => {
      cb.addEventListener("change", handleCombinedFilter);
    });
  } catch (error) {
    console.error("Error loading filters:", error);
  }
}
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
    const vendorBusyness = vendor.busyness || "no data";

    const matchesFood =
      selectedFoodTypes.length === 0 ||
      selectedFoodTypes.includes(vendor.description);

    const matchesBusyness =
      selectedBusyness.length === 0 ||
      selectedBusyness.includes(vendorBusyness);

    return matchesFood && matchesBusyness;
  });

  renderFilteredCards(filtered);
}

// base on the selected filters, re-render the restaurant cards
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

  vendors.forEach((vendor) => {
    const card = template.content.cloneNode(true);

    card.querySelector(".card-image").src = vendor.image_url;
    card.querySelector(".card-image").alt = vendor.business_name;
    card.querySelector(".card-title").textContent = vendor.business_name;
    card.querySelector(".card-text").innerHTML = `
      <strong>${vendor.description || "Various"}</strong><br>
      ${vendor.location}<br>
      <span class="badge ${vendor.status === "open" ? "bg-success" : "bg-secondary"} mt-2">
        ${vendor.status === "open" ? "● Open" : "● Closed"}
      </span>
      
      <p class="text-muted small mt-2">📍 ${vendor.geo_localarea || "Vancouver"}</p>
      
    `;

    const busyness = document.createElement("p");
    busyness.classList.add("mt-3", "mb-2", "fw-semibold");
    busyness.textContent = `Busyness: ${vendor.busyness || "no data"}`;
    card.querySelector(".card-body").appendChild(busyness);

    const heartEl = document.createElement("i");
    heartEl.classList.add("material-icons", "fav-icon");
    heartEl.textContent = "♡";
    heartEl.style.cssText = "font-size: 36px; cursor: pointer; color: white;";

    const heartWrapper = document.createElement("div");
    heartWrapper.classList.add("d-flex", "justify-content-end", "mt-2");
    heartWrapper.appendChild(heartEl);

    card.querySelector(".card-body").appendChild(heartWrapper);

    heartEl.addEventListener("click", async () => {
      const isFavorited = heartEl.textContent === "♥";
      heartEl.textContent = isFavorited ? "♡" : "♥";
      heartEl.style.color = isFavorited ? "white" : "red";

      const user = auth.currentUser;
      if (user) {
        await toggleBookmark(user.uid, vendor.id);
      } else {
        console.log("Login to save favorites");
      }
    });

    container.appendChild(card);
  });
}

// once page is loaded, generate the restaurant cards, and load the filters
loadFilters();
