class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <footer class="fixed-bottom footer">
            <ul class="footer-nav">
            <li onclick="window.location.href='main.html'">
                <a href="#"><span class="material-symbols-outlined">home</span>
                <span class="home">home</span></a>
            </li>
            <li>
                <a href="#"><span class="material-symbols-outlined">history_2</span>
                <span class="Recent">Recent</span></a>
            </li>
            <li>
                <a href="#"><span class="material-symbols-outlined">calendar_meal</span>
                <span class="Reservation">Reservation</span></a>
            </li>
            <li onclick="window.location.href='favorites.html'">
                <a href="#"><span class="material-symbols-outlined">favorite</span>
                <span class="favorite">Favorite</span></a>
            </li>
            </ul>
        </footer>
    `;
  }
}

customElements.define("site-footer", SiteFooter);
