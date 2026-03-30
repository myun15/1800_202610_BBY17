import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

// Get the document ID from the URL
function getDocIdFromUrl() {
    const params = new URL(window.location.href).searchParams;
    return params.get("docID");
}

// Fetch the restaurant and display its name and image
async function displayRestaurantInfo() {
    const id = getDocIdFromUrl();
    
    if (!id) {
        console.error("No document ID provided");
        const nameElement = document.getElementById("restaurantName");
        if (nameElement) nameElement.textContent = "No restaurant selected";
        return;
    }

    try {
        const restaurantRef = doc(db, "restaurants", id);
        const restaurantSnap = await getDoc(restaurantRef);

        const restaurant = restaurantSnap.data();
        const name = restaurant.name;
        const code = restaurant.code;

        // Update the page
        document.getElementById("restaurantName").textContent = name;
        const img = document.getElementById("restaurantImage");
        img.src = `./images/${code}.jpg`;
        img.alt = `${name} image`;
    } catch (error) {
        console.error("Error loading restaurant:", error);
        document.getElementById("restaurantName").textContent = "Error loading restaurant.";
    }
}

displayRestaurantInfo();
