import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import L from "leaflet"
import "leaflet/dist/leaflet.css" 
import { onAuthReady, logoutUser } from "./helper/authentication.js";
import { auth } from "/src/helper/firebaseConfig.js"; 
import "/src/styles/style.css";

function logOutUserOnButtonClick() {
  document.getElementById("logOutBtn").addEventListener("click", () => {
    logoutUser();
  });
}

function showNameWhenLoggedIn() {
  const nameElement = document.getElementById("welcome-user");

  onAuthReady((user) => {
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

function hideLoginSignupButton() {
  const loginBtn = document.getElementById('loginBtn')
  const signInBtn = document.getElementById('signInBtn')
  const logOutBtn = document.getElementById('logOutBtn');

  onAuthReady(user => {
    if (user) {
      loginBtn.style.visibility = "hidden";
      signInBtn.style.visibility = "hidden";
      logOutBtn.style.visibility = "visible";
      return; 
    }
    
    loginBtn.style.visibility = "visible";
    signInBtn.style.visibility = "visible";
    logOutBtn.style.visibility = "hidden";
  })
}

function openMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return; // Only init if #map element exists on the page

  var map = L.map("map", {
    center: [51.505, -0.09],
    zoom: 13,
  })

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
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
logOutUserOnButtonClick();