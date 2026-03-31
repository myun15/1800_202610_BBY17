async function renderSavedRestaurants(userId) {
    const container = document.getElementById("Restaurants-go-here"); // Match your ID from previous code
    const template = document.getElementById("vendorCardTemplate"); // Using the vendor template

    container.innerHTML = "";

    try {
        const userRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userRef);

        if (!userDocSnap.exists()) {
            container.innerHTML = "<p class='text-center'>User not found.</p>";
            return;
        }

        const bookmarks = userDocSnap.data().bookmarks || [];

        if (bookmarks.length === 0) {
            container.innerHTML = "<p class='text-center'>No favorite restaurants yet!</p>";
            return;
        }

        // Loop through each bookmarked ID
        for (const restaurantId of bookmarks) {
            const restRef = doc(db, "restaurants", restaurantId); // Assuming collection is "restaurants"
            const restDoc = await getDoc(restRef);

            if (restDoc.exists()) {
                const data = restDoc.data();
                const card = template.content.cloneNode(true);

                // Mapping Restaurant data to the UI
                card.querySelector(".card-title").innerText = data.business_name;
                card.querySelector(".category-text").innerText = data.description || "Various";
                card.querySelector(".address-text").innerText = data.location;
                
                // Status Badge logic
                const badge = card.querySelector(".status-badge");
                badge.innerText = data.status === "open" ? "● Open" : "● Closed";
                badge.className = `status-badge badge rounded-pill px-3 ${data.status === 'open' ? 'bg-success' : 'bg-secondary'}`;

                // Image logic
                card.querySelector(".vendor-img").src = data.image_url || "./images/default-food.jpg";

                container.appendChild(card);
            }
        }
    } catch (error) {
        console.error("Error loading favorites:", error);
        container.innerHTML = "<p>Error loading your favorites.</p>";
    }
}