import { onAuthReady, logoutUser } from "/src/helper/authentication.js";

class SiteNavbar extends HTMLElement {
  constructor() {
    super();
    this.renderNavbar();
  }

  renderNavbar() {
    onAuthReady((user) => {
      const href = user ? "./main.html" : "./index.html";

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
                    TimesUp
                </a>
                </div>
                      <div class="d-flex gap-2">
        <input
          type="text"
          class="address-input form-control py-3"
          placeholder="Enter address"
        />
        <button class="search-button btn btn-danger">Search</button>
        <button class="open-map-button btn btn-success">Map</button>
      </div>
                <form class="d-flex">
                <div class="d-flex flex-row gap-3 pe-5">
                <button id="loginBtn" class="login 3 rounded-pill" onclick="window.location.href='login.html'"
                    type="button">Log in</button>

                <button id="logOutBtn" class="login col-md-auto rounded-pill me-4" type="button">Log Out</button>
                </div>
            </nav>
        `;

      this.querySelector("#logOutBtn").addEventListener("click", () =>
        logoutUser(),
      );
    });
  }
}

customElements.define("site-navbar", SiteNavbar);
