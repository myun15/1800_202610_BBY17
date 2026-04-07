import { onAuthReady, logoutUser } from "/src/helper/authentication.js";

class SiteNavbar extends HTMLElement {
  constructor() {
    super();
    this.renderNavbar();
  }

  renderNavbar() {
    onAuthReady((user) => {
      const href = "/index.html";
      const authButton = user
        ? `<button id="logOutBtn" class="login col-md-auto rounded-pill me-4" type="button">Log Out</button>`
        : `<button id="loginBtn" class="login col-md-auto rounded-pill" onclick="window.location.href='/pages/login.html'" type="button">Log in</button> 
           <button id="loginBtn" class="login col-md-auto rounded-pill" onclick="window.location.href='/pages/login.html#signup'" type="button">Sign up</button>`;

      this.innerHTML = `
            <nav class="navbar">
                <div class="navbar-main-container">
                  <div class="d-flex align-items-center gap-2" style="flex-shrink: 0;">
                        <div class="dropdown">
                            <button type="button" class="btn btn-link" data-bs-toggle="dropdown">
                            <img src="images/menu.svg" alt="dropdown" class="navbar-menu-icon" />
                            </button>
                            <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#">asdf</a></li>
                            <li><a class="dropdown-item" href="#">asdf</a></li>
                            <li><a class="dropdown-item" href="#">asdf</a></li>
                            </ul>                  
                        </div>
                        <a class="navbar-brand" href="${href}">
                            TimesUp
                        </a>
                  </div>

                  <div class="navbar-right">
                    <div class="d-flex navbar-search-wrapper">
                        <input
                        type="text"
                        class="address-input form-control px-5"
                        placeholder="Enter address"
                        />
                        <button class="search-button btn btn-danger">Search</button>
                    </div>
                    <div class="d-flex flex-row navbar-auth-wrapper">
                        ${authButton}
                    </div>
                  </div>
                </div>
            </nav>
        `;

      if (user) {
        this.querySelector("#logOutBtn").addEventListener("click", () =>
          logoutUser(),
        );
      }
    });
  }
}

customElements.define("site-navbar", SiteNavbar);
