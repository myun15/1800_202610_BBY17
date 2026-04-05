class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
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
    `;
  }
}

customElements.define("site-footer", SiteFooter);