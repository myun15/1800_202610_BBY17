import { onAuthReady } from "/src/helper/authentication.js";

class SiteFooter extends HTMLElement {
  connectedCallback() {
    onAuthReady((user) => {
      if (user) {
        this.innerHTML = `
                <footer class="fixed-bottom footer">
                    <ul class="footer-nav d-flex justify-content-center">
                    <li onclick="window.location.href='/index.html'">
                        <a href="#" class="text-dark d-flex flex-column align-items-center"><span class="material-symbols-outlined">home</span>
                        <span class="home">home</span></a>
                    </li>
                    <li onclick="window.location.href='/pages/recent.html'">
                        <a href="#" class="text-dark d-flex flex-column align-items-center"><span class="material-symbols-outlined">history_2</span>
                        <span class="Recent">Recent</span></a>
                    </li>
                    <li onclick="window.location.href='/pages/featuredRestaurants.html'">
                        <a href="#" class="text-dark d-flex flex-column align-items-center"><span class="material-symbols-outlined">calendar_meal</span>
                        <span class="Featured Vendor">Featured Vendor</span></a>
                    </li>
                    <li onclick="window.location.href='/pages/favorites.html'">
                        <a href="#"class="text-dark d-flex flex-column align-items-center"><span class="material-symbols-outlined">favorite</span>
                        <span class="favorite">Favorite</span></a>
                    </li>
                    </ul>
                </footer>
            `;
      }
    });
  }
}

customElements.define("site-footer", SiteFooter);
