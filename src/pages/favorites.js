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

  for (const restaurant of restaurants) {
    const li = document.createElement("li");
    li.textContent = restaurant.name;

    const img = document.createElement("img");
    img.src = restaurant.imageSrc;
    img.alt = restaurant.name;
    img.addEventListener("click", () => {
      window.location.href = "review.html";
    });

    li.appendChild(img);
    restaurantsEl.appendChild(li);
  }
}

createRestaurantsFavorites();
