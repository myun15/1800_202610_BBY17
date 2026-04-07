class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<<<<<<< HEAD
      <footer class="footer">
        <ul class="footer-nav">
          <li>
            <a href="home.html" class="footer-link">
              <span class="material-symbols-outlined">home</span>
              <span>home</span>
            </a>
          </li>

          <li>
            <a href="recent.html" class="footer-link">
              <span class="material-symbols-outlined">history</span>
              <span>Recent</span>
            </a>
          </li>

          <li>
            <a href="reservation.html" class="footer-link">
              <span class="material-symbols-outlined">calendar_month</span>
              <span>Reservation</span>
            </a>
          </li>

          <li>
            <a href="favorites.html" class="footer-link">
              <span class="material-symbols-outlined">favorite</span>
              <span>Favorite</span>
            </a>
          </li>
        </ul>
      </footer>
=======
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
>>>>>>> 1f071a007837d2019538ae36d30a5750acf5c816
    `;
  }
}

customElements.define("site-footer", SiteFooter);