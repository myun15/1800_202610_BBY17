class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <footer class="fixed-bottom footer">
<<<<<<< HEAD
            <ul class="footer-nav">
            <li onclick="window.location.href='home.html'">
                <a href="#"><span class="material-symbols-outlined">home</span>
=======
            <ul class="footer-nav d-flex justify-content-center">
            <li onclick="window.location.href='main.html'">
                <a href="#" class="text-dark d-flex flex-column align-items-center"><span class="material-symbols-outlined">home</span>
>>>>>>> c6c0e4e9e2cdf70bb942805550d3f2df10832573
                <span class="home">home</span></a>
            </li>
            <li onclick="window.location.href='recent.html'">
                <a href="#" class="text-dark d-flex flex-column align-items-center"><span class="material-symbols-outlined">history_2</span>
                <span class="Recent">Recent</span></a>
            </li>
            <li onclick="window.location.href='restaurant.html'">
                <a href="#" class="text-dark d-flex flex-column align-items-center"><span class="material-symbols-outlined">calendar_meal</span>
                <span class="Reservation">Reservation</span></a>
            </li>
            <li onclick="window.location.href='favorites.html'">
                <a href="#"class="text-dark d-flex flex-column align-items-center"><span class="material-symbols-outlined">favorite</span>
                <span class="favorite">Favorite</span></a>
            </li>
            </ul>
        </footer>
    `;
  }
}

customElements.define("site-footer", SiteFooter);
