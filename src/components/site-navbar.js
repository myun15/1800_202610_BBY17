import { onAuthReady, logoutUser } from "/src/helper/authentication.js";

class SiteNavbar extends HTMLElement {
  constructor() {
    super();
    this.renderNavbar();
  }

  renderNavbar() {
    onAuthReady(user => {
        const href = user ? "./main.html" : "./index.html";
        const authButton = user
            ? `<button id="logOutBtn" class="login col-md-auto rounded-pill me-4" type="button">Log Out</button>`
            : `<button id="loginBtn" class="login col-md-auto rounded-pill" onclick="window.location.href='login.html'" type="button">Log in</button>`;

        this.innerHTML = `
            <nav class="navbar navbar-expand-lg">
                <div class="container d-flex justify-content-start ms-0 ps-4 gap-2">
                <div class="dropdown">
                    <button type="button" class="btn btn-link" data-bs-toggle="dropdown">
                    <img src="images/menu.svg" alt="dropdown" width="20" height="25" />
                    </button>
                    <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#">asdf</a></li>
                    <li><a class="dropdown-item" href="#">asdf</a></li>
                    <li><a class="dropdown-item" href="#">asdf</a></li>
                    </ul>
                </div>
                <a class="navbar-brand col-md-auto" href="${href}">
                    Website Name
                </a>
                </div>
                <div class="d-flex flex-row gap-3 pe-5">
                ${authButton}
                </div>
            </nav>
        `;

        if (user) {
            this.querySelector('#logOutBtn').addEventListener('click', () => logoutUser());
        }
    })
  }
}

customElements.define("site-navbar", SiteNavbar);