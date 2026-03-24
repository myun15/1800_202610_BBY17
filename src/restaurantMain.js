import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "/src/helper/firebaseConfig.js";

// Import json file to Firebase
async function addRestaurantData() {
    const restaurantsRef = collection(db, "restaurants");
    
    try {
        // Load JSON data
        const response = await fetch('/data/food-vendors.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const vendors = await response.json();
        
        // Filter vendors with names
        const validVendors = vendors.filter(vendor => vendor.business_name);
        
        console.log(`Adding ${validVendors.length} vendors to Firebase...`);
        
        let count = 0;
        for (const vendor of validVendors) {
            await addDoc(restaurantsRef, {
                key: vendor.key,
                name: vendor.business_name,
                vendor_type: vendor.vendor_type,
                status: vendor.status,
                location: vendor.location,
                description: vendor.description,
                geo_localarea: vendor.geo_localarea,
                lat: vendor.geo_point_2d.lat,
                lng: vendor.geo_point_2d.lon,
                cuisine: vendor.description || "Various",
                rating: 4.0,
                imageSrc: `/images/food-truck.jpg`
            });
            count++;
        }
        
        console.log(`Successfully added ${count} vendors`);
        return true;
        
    } catch (error) {
        console.error("Error adding restaurant data:", error);
        return false;
    }
}

// Seeds the "restaurants" collection with initial data if it is empty
async function seedRestaurants() {
    const restaurantsRef = collection(db, "restaurants");
    const querySnapshot = await getDocs(restaurantsRef);

    if (querySnapshot.empty) {
        console.log("Restaurants collection is empty. Seeding data...");
        await addRestaurantData();
        console.log("Seeding complete!");
        return true;
    } else {
        console.log(`Restaurants collection already contains ${querySnapshot.size} restaurants. Skipping seed.`);
        return false;
    }
}

// Show restaurant cards dynamically (from Firebase)
async function displayRestaurantCardsDynamically() {
    const cardTemplate = document.getElementById("restaurantCardTemplate");
    const restaurantsCollectionRef = collection(db, "restaurants");
    const container = document.getElementById("Restaurants-go-here");

    if (!container) {
        console.error("Container #Restaurants-go-here not found");
        return;
    }

    try {
        // show loading state
        container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Loading restaurants...</p></div>';

        const querySnapshot = await getDocs(restaurantsCollectionRef);
        
        if (querySnapshot.empty) {
            container.innerHTML = '<div class="col-12"><p class="text-center">No restaurants found.</p></div>';
            return;
        }

        // clear container
        container.innerHTML = '';
        
        querySnapshot.forEach(doc => {
            const newcard = cardTemplate.content.cloneNode(true);
            const restaurant = doc.data();

            // fill card data
            newcard.querySelector('.card-title').textContent = restaurant.name;
            
            // detailed information
            const cardText = newcard.querySelector('.card-text');
            cardText.innerHTML = `
                <strong>${restaurant.cuisine || restaurant.description}</strong><br>
                ${restaurant.location || restaurant.geo_localarea}<br>
                <span class="badge ${restaurant.status === 'open' ? 'bg-success' : 'bg-secondary'} mt-2">
                    ${restaurant.status === 'open' ? '● Open' : '● Closed'}
                </span>
            `;
            
            // set image
            const imgElement = newcard.querySelector('.card-image');
            imgElement.src = restaurant.imageSrc || '/images/food-truck.jpg';
            imgElement.alt = restaurant.name;
            
            // handle image loading failure
            imgElement.onerror = () => {
                imgElement.src = '/images/food-truck.jpg';
            };
            
            // Add location information
            const locationText = document.createElement('p');
            locationText.className = 'text-muted small mt-2';
            locationText.innerHTML = `📍 ${restaurant.geo_localarea || 'Vancouver'}`;
            newcard.querySelector('.card-body').appendChild(locationText);
            
            // Add rating
            if (restaurant.rating) {
                const ratingDiv = document.createElement('div');
                ratingDiv.className = 'mb-2';
                ratingDiv.innerHTML = `⭐ ${restaurant.rating} / 5`;
                newcard.querySelector('.card-body').insertBefore(ratingDiv, cardText);
            }
            
            // Add link
            newcard.querySelector(".read-more").href = `eachRestaurant.html?docID=${doc.id}`;
            
            // Add to container
            container.appendChild(newcard);
        });
        
        console.log(`Displayed ${querySnapshot.size} restaurants`);
        
    } catch (error) {
        console.error("Error loading restaurants: ", error);
        container.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error loading restaurants. Please refresh the page.</p></div>';
    }
}

// displayRestaurantInfo
async function init() {
    await seedRestaurants();      // check before import (if needed)
    await displayRestaurantCardsDynamically();  // show data
}

// loading pages after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { seedRestaurants, addRestaurantData, displayRestaurantCardsDynamically };
