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
            const card = template.content.cloneNode(true);

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
