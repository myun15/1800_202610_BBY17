import { auth, db } from "../helper/firebaseConfig.js";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  query,
  limit,
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

async function displayVendorCards() {
  const template = document.getElementById("vendorCardTemplate");
  const container = document.getElementById("Restaurants-go-here");

  if (!container || !template) {
    console.error("Missing container or template element");
    return;
  }

  try {
    // 读取 Firestore 的 vendors collection，只拿 5 笔
    const vendorsRef = collection(db, "vendors"); // collection 名称改成你的
    const q = query(vendorsRef, limit(5));
    const snapshot = await getDocs(q);

    const vendors = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    const validVendors = vendors.filter((v) => v.name);

    if (validVendors.length === 0) {
      container.innerHTML =
        '<div class="col-12"><p class="text-center">No vendors found.</p></div>';
      return;
    }

    container.innerHTML = "";

    validVendors.forEach((vendor) => {
      const card = template.content.cloneNode(true);
      const vendorID = vendor.id;

      const imageEl = card.querySelector(".card-image");
      const titleEl = card.querySelector(".card-title");
      const textEl = card.querySelector(".card-text");
      const bodyEl = card.querySelector(".card-body");

      if (imageEl) {
        imageEl.src = vendor.imageSrc || "/images/food-truck.jpg";
        imageEl.alt = vendor.name || "Vendor image";
      }

      if (titleEl) {
        titleEl.textContent = vendor.name || "Unnamed Vendor";
      }

      if (textEl) {
        textEl.innerHTML = `
          <strong>${vendor.description || vendor.cuisine || "Various"}</strong><br>
          ${vendor.location || "No location"}<br>
          <span class="badge ${vendor.status === "open" ? "bg-success" : "bg-secondary"} mt-2">
            ${vendor.status === "open" ? "● Open" : "● Closed"}
          </span>
          <p class="text-muted small mt-2">📍 ${vendor.geo_localarea || "Vancouver"}</p>
        `;
      }

      const heartEl = document.createElement("i");
      heartEl.classList.add("material-icons", "fav-icon");
      heartEl.id = "save-" + vendorID;
      heartEl.textContent = "♡";
      heartEl.style.cssText = "font-size: 36px; cursor: pointer; color: white;";

      const heartWrapper = document.createElement("div");
      heartWrapper.classList.add("d-flex", "justify-content-end", "mt-2");
      heartWrapper.appendChild(heartEl);

    //   if (bodyEl) {
    //     bodyEl.appendChild(heartWrapper);
    //   }

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

    console.log(`Displayed ${validVendors.length} vendors from Firestore`);
  } catch (error) {
    console.error("Error loading vendors from Firestore:", error);
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
