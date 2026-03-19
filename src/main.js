import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "/src/helper/firebaseConfig.js"
import { onAuthReady, logoutUser } from "./helper/authentication.js";
import "/src/styles/style.css";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

// --- Map Preview for main.html ---
let previewMap;
const VANCOUVER = { lat: 49.2827, lng: -123.1207 };

function initPreviewMap() {
  const mapEl = document.getElementById("map-preview");
  if (!mapEl) return; // Only run if the div exists

  previewMap = new google.maps.Map(mapEl, {
    zoom: 13,
    center: VANCOUVER,
  });

  // Try to get user location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        previewMap.setCenter(userLocation);

        new google.maps.Marker({
          position: userLocation,
          map: previewMap,
          title: "You are here",
        });
      },
      () => {
        console.log("Location denied, showing Vancouver");
      }
    );
  }
}

// Initialize the map preview when page loads
window.addEventListener("load", initPreviewMap);

function showNameWhenLoggedIn() {
  onAuthReady((user) => {
    const nameElement = document.getElementById("welcome-user");
    if (!user) {
      if (nameElement) {
        nameElement.textContent = "";
      }

      return;
    }

    const name = user.displayName || user.email;

    if (nameElement) {
      nameElement.textContent = `Welcome ${name}`;
    }
  });
}

function addRestaurantData() {
  const restaurantsRef = collection(db, "restaurants");
  console.log("Adding restaurant data...");

  addDoc(restaurantsRef, {
    name: "Mcdonalds",
    address: "2725 Barnet Hwy",
    city: "Coquitlam",
    postalCode: "V3E 1K9",
    imageSrc: "https://imgs.search.brave.com/yUM1oHO8q970lFc2x60brpy_gERQo7DyVNDa0X5QvLw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9j/L2M2L01jRG9uYWxk/c19NdXNldW0uanBn"
  });

  addDoc(restaurantsRef, {
    name: "Burger King",
    address: "10240 King George Blvd",
    city: "Surrey",
    postalCode: "V3T 2W5",
    imageSrc: "https://imgs.search.brave.com/bXj18gOddNSVLWysDNp9Vl95-L3qKASqz8-4O38kAeg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMjE5/MzUxNTQyNS9waG90/by9idXJnZXIta2lu/Zy1mYXN0LWZvb2Qt/cmVzdGF1cmFudC1m/YWNhZGUtaW4taWFz/aS1yb21hbmlhLmpw/Zz9zPTYxMng2MTIm/dz0wJms9MjAmYz16/WlByRWdfNkxLZUhi/SnJJRzFSNWtJcmxJ/VDRYRTRVcWRfMFk0/aHNHbV80PQ"
  });

  addDoc(restaurantsRef, {
    name: "Wendy's",
    address: "100 Schoolhouse St",
    city: "Coquitlam",
    postalCode: "V3K 4V9",
    imageSrc: "https://imgs.search.brave.com/3DZUYtECIUp2o2RzX5CpIi-MuAmWiCTyErYnw5XXNmQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9sb25k/b24tdWstYXVndXN0/LXdlbmR5LXMtcmVz/dGF1cmFudC1mYWNh/ZGUtc2hvd2Nhc2lu/Zy1xdWFsaXR5LWJ1/cmdlcnMtZmFzdC1m/b29kLWRpc3BsYXlp/bmctc2lnbmFnZS1i/cmFuZGluZy0zOTc5/NTMyNTYuanBn"
  });
}

async function seedRestaurants() {
  const restaurantsRef = collection(db, "restaurants");

  const querySnapshot = await getDocs(restaurantsRef);

  if (querySnapshot.empty) {
    addRestaurantData();
  } else {
    console.log("Restaurant collection already contains data. Skipping seed...");
  }
}

function hideLoginSignupButton() {
  onAuthReady((user) => {
    const loginBtn = document.getElementById("loginBtn");
    // const signInBtn = document.getElementById("signInBtn");
    const logOutBtn = document.getElementById("logOutBtn");
    if (user) {
      loginBtn.style.visibility = "hidden";
      // signInBtn.style.visibility = "hidden";
      logOutBtn.style.visibility = "visible";
      return;
    }

    loginBtn.style.visibility = "visible";
    // signInBtn.style.visibility = "visible";
    logOutBtn.style.visibility = "hidden";
  });
}

async function collectionToJSON(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return data;
}

async function createRestaurantsFavorites() {
  const restaurants = await collectionToJSON("restaurants");
  const restaurantsEl = document.getElementById("restaurants");

  if (!restaurants || !restaurantsEl) return;

  for (let restaurant of restaurants) {
    const li = document.createElement("li");
    li.innerHTML = `${restaurant.name}
                    <img onclick="window.location.href='review.html'" src="${restaurant.imageSrc}" alt="${restaurant.name}">`;
    restaurantsEl.appendChild(li);
  }
}

function openMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return; // Only init if #map element exists on the page

  var map = L.map("map", {
    center: [51.505, -0.09],
    zoom: 13,
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
}

async function addReviewToDatabase() {
  submit.addEventListener("click", () => {
    const nameEl = document.getElementById('restaurantname');
    const commentEl = document.getElementById('comment');
    const submit = document.getElementById("submit");
    let restaurantName;
    let comment = "";

    if (nameEl && nameEl.value) {
      restaurantName = nameEl.value;
    } else {
      alert("Enter Restaurant Name.");
      return;
    }

    if (commentEl && commentEl.value) {
      comment = commentEl.value;
    }

    const reviewRef = collection(db, "reviews");

    addDoc(reviewRef, {
      restaurant: restaurantName,
      comment: comment,
    })

    window.location.href = "main.html";
  })
}

// function makeReview(restaurant) {
//   const restaurantId = document.getElementById("restaurant");

//   if (restaurantId) {
//     window.location.href = "review.html";
//   }
// }

// document.getElementById("favorites-mcdonalds")?.addEventListener("click", () => {
//   makeReview("mcdonalds");
// })

openMap();
hideLoginSignupButton();
showNameWhenLoggedIn();
seedRestaurants();
createRestaurantsFavorites();
addReviewToDatabase();