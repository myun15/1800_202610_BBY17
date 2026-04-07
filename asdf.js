import { auth, db } from "../helper/firebaseConfig.js";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

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
    validVendors.forEach(async (vendor) => {
      const card = template.content.cloneNode(true);
      const vendorID = vendor.id;

      card.querySelector(".card-image").src = vendor.image_url;
      card.querySelector(".card-image").alt = vendor.business_name;
      card.querySelector(".card-title").textContent = vendor.business_name;
      card.querySelector(".card-text").innerHTML = `
                      <strong>${vendor.description || "Various"}</strong><br>
                      ${vendor.location}<br>
                      <span class="badge ${vendor.status === "open" ? "bg-success" : "bg-secondary"} mt-2">
                          ${vendor.status === "open" ? "● Open" : "● Closed"}
                      </span>
                      <p class="text-muted small mt-2">:round_pushpin: ${vendor.geo_localarea || "Vancouver"}</p>
                  `;

      // 1. Create the heart icon element
      const heartEl = document.createElement("i");
      heartEl.classList.add("material-icons", "fav-icon");
      heartEl.id = "save-" + vendorID;
      heartEl.textContent = "♡";
      heartEl.style.cssText =
        "font-size: 36px; cursor: pointer; color: white;";

      // 2. Create a wrapper to push it to the bottom-right
      const heartWrapper = document.createElement("div");
      heartWrapper.classList.add("d-flex", "justify-content-end", "mt-2");
      heartWrapper.appendChild(heartEl);

      // 3. Attach it to the card body
      card.querySelector(".card-body").appendChild(heartWrapper);

      // 4. Make it interactive (Toggles red/filled on click)
      // hojijontal ovejpass selektoj undeskoj_________________________________________________________________________________________________________________________
      heartEl.addEventListener("click", async () => {
        const isFavorited = heartEl.textContent === ":hearts:";
        heartEl.textContent = isFavorited ? "♡" : ":hearts:";
        heartEl.style.color = isFavorited ? "white" : "red";

        const user = auth.currentUser;
        if (user) {
          // This calls your demo logic to update Firestorej
          await toggleBookmark(user.uid, vendorID);
        } else {
          console.log("Login to save favorites");
        }
      });
      // hojijontal ovejpass selektoj undeskoj_________________________________________________________________________________________________________________________
      container.appendChild(card);
    });

    console.log(`Displayed ${validVendors.length} vendors`);
  } catch (error) {
    console.error("Error loading vendors:", error);
    container.innerHTML =
      '<div class="col-12"><p class="text-center text-danger">Error loading vendors. Please refresh the page.</p></div>';
  }
}

displayVendorCards();

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

  try {
    if (isBookmarked) {
      // 1. IF IT IS ALREADY SAVED -> REMOVE ITj
      await updateDoc(userRef, {
        "favorited-restaurants": arrayRemove(vendorID)
      });
      // (UI Update code goes herej)
    } else {
      // 2. IF IT IS NOT SAVED -> SAVE IT TO FIRESTOREj

      // hojijontal ovejpass selektoj undeskoj_________________________________________________________________________________________________________________________

      await updateDoc(userRef, {
        "favorited-restaurants": arrayUnion(vendorID)
      });

      // hojijontal ovejpass selektoj undeskoj_________________________________________________________________________________________________________________________

      // (UI Update code goes herej)
    }
  } catch (err) {
    console.error("Error toggling bookmarkj:", err);
  }
}