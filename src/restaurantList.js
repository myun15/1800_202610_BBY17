import { collection, getDocs } from "firebase/firestore";
import { db } from "/src/helper/firebaseConfig.js";

// Seeds the "restaurants" collection with initial data if it is empty
async function seedRestaurants() {

    // Get a reference to the "restaurants" collection
    const restaurantsRef = collection(db, "restaurants");

    // Retrieve all documents currently in the collection
    const querySnapshot = await getDocs(restaurantsRef);

    // If no documents exist, the collection is empty
    if (querySnapshot.empty) {

        console.log("Restaurants collection is empty. Seeding data...");

        // Call function to insert default restaurant documents
        addRestaurantData();

    } else {

        // If documents already exist, do not reseed
        console.log("Restaurants collection already contains data. Skipping seed.");
    }
}

// Call the seeding function when the main.html page loads.
seedRestaurants();

async function displayRestaurantCardsDynamically() {
    let cardTemplate = document.getElementById("restaurantCardTemplate");
    const restaurantsCollectionRef = collection(db, "restaurants");

    try {
        const querySnapshot = await getDocs(restaurantsCollectionRef);
        querySnapshot.forEach(doc => {
            // Clone the template
            let newcard = cardTemplate.content.cloneNode(true);
            // Get restaurant data once
            const restaurant = doc.data(); 

            // Populate the card with restaurant data
            newcard.querySelector('.card-title').textContent = restaurant.name;
            newcard.querySelector('.card-text').textContent = restaurant.details || `Located in ${restaurant.city}.`;
            newcard.querySelector('.card-length').textContent = restaurant.length;
            
            // 👇 ADD THIS LINE TO SET THE IMAGE SOURCE
            newcard.querySelector('.card-image').src = `./images/${restaurant.code}.jpg`;
            // Add the link with the document ID
            newcard.querySelector(".read-more").href = `eachRestaurant.html?docID=${doc.id}`;
            
            // Attach the new card to the container
            document.getElementById("Restaurants-go-here").appendChild(newcard);
        });
    } catch (error) {
        console.error("Error getting documents: ", error);
    }
}

// Call the function to display cards when the page loads
displayRestaurantCardsDynamically();