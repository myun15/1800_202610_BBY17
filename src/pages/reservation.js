async function displayVendorCards() {
    const template = document.getElementById("vendorCardTemplate");
    const container = document.getElementById("Restaurants-go-here");

    if (!container || !template) {
        console.error("Missing container or template element");
        return;
    }

    container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Loading vendors...</p></div>';

    try {
        const response = await fetch('/data/food-vendors.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const vendors = await response.json();
        const validVendors = vendors.filter(v => v.business_name);

        if (validVendors.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-center">No vendors found.</p></div>';
            return;
        }

        container.innerHTML = '';

        validVendors.forEach(vendor => {
            // Create cards for each restaurant
            const card = template.content.cloneNode(true);
            
            //-------------------------------------------------------------------------------------------------------
            // const heartEl = document.createElement("img");
// 1. Create the heart icon element
            const heartEl = document.createElement("i");
            heartEl.classList.add("material-icons", "fav-icon"); // Uses your CSS classes
            heartEl.textContent = "♡";            // The "empty heart" shape
            heartEl.style.cssText = "font-size: 36px; cursor: pointer; color: white;";

            // 2. Create a wrapper to push it to the bottom-right
            const heartWrapper = document.createElement("div");
            heartWrapper.classList.add("d-flex", "justify-content-end", "mt-2");
            heartWrapper.appendChild(heartEl);

            // 3. Attach it to the card body
            card.querySelector('.card-body').appendChild(heartWrapper);

            // 4. Make it interactive (Toggles red/filled on click)
            heartEl.addEventListener("click", () => {
                const isFavorited = heartEl.textContent === "♥";
                heartEl.textContent = isFavorited ? "♡" : "♥";
                heartEl.style.color = isFavorited ? "white" : "red";
            });
            // card.appendChild(heartEl);
            //-------------------------------------------------------------------------------------------------------
            card.querySelector('.card-title').textContent = vendor.business_name;
            card.querySelector('.card-text').innerHTML = `
                <strong>${vendor.description || 'Various'}</strong><br>
                ${vendor.location}<br>
                <span class="badge ${vendor.status === 'open' ? 'bg-success' : 'bg-secondary'} mt-2">
                    ${vendor.status === 'open' ? '● Open' : '● Closed'}
                </span>
                <p class="text-muted small mt-2">📍 ${vendor.geo_localarea || 'Vancouver'}</p>
            `;

            container.appendChild(card);
        });

        console.log(`Displayed ${validVendors.length} vendors`);
    } catch (error) {
        console.error("Error loading vendors:", error);
        container.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error loading vendors. Please refresh the page.</p></div>';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayVendorCards);
} else {
    displayVendorCards();
}

document.getElementById("card").addEventListener("click", function() {
    
    // Changing the path to reflect your new 'cards' data
    ajaxGET("/cards?format=json", function (data) {
        let parsedData = JSON.parse(data);

        let str = "<div class='card-grid'>"; 
        for (let i = 0; i < parsedData.length; i++) {
            let item = parsedData[i];
            
            // Building a 'Card' layout instead of a simple table row
            str += "<div class='card'>";
            str += "<h3>" + item["title"] + "</h3>";
            str += "<img src='" + item["image"] + "' alt='card image'>";
            str += "<p><strong>From:</strong> " + item["start"] + " <strong>To:</strong> " + item["end"] + "</p>";
            str += "<p>" + item["description"] + "</p>";
            str += "</div>";
        }
        str += "</div>";

        // Update the container with the new 'Cards' HTML
        document.getElementById("card").innerHTML = str;
    });
});

document.querySelectorAll('[class*="__heart"]').forEach(heart => {
    heart.addEventListener('click', (e) => {
        // 1. 클릭된 하트의 부모 컨테이너에서 정보를 추출 (데이터 저장용)
        const cardContainer = e.target.closest('[class*="__container"]');
        
        // 2. 하트 상태 변경 (시각 효과)
        e.target.textContent = "♥";
        e.target.style.color = "red";

        // 3. 페이지 이동 (favourite.html로 슝!)
        window.location.href = 'favourite.html'; 
    });
});

function loadFavorites() {
    if (!window.location.pathname.includes('favourite.html')) return;
    
    const container = document.getElementById("Restaurants-go-here");
    const savedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];

    if (savedFavorites.length === 0) {
        container.innerHTML = '<h3>찜한 가게가 없습니다.</h3>';
        return;
    }

    container.innerHTML = savedFavorites.map(vendor => `
        <div class="card">
            <h5>${vendor.name}</h5>
            <p>${vendor.location}</p>
        </div>
    `).join('');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFavorites);
} else {
    loadFavorites();
}