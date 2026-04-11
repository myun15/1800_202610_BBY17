import { onAuthReady, logoutUser } from "/src/helper/authentication.js";

class SiteNavbar extends HTMLElement {
  constructor() {
    super();
    this.renderNavbar();
  }

  renderNavbar() {
    onAuthReady((user) => {
      const href = user ? "./home.html" : "./index.html";
      const authButton = user
        ? `<button id="logOutBtn" class="login col-md-auto rounded-pill me-4" type="button">Log Out</button>`
        : `<button id="loginBtn" class="login col-md-auto rounded-pill" onclick="window.location.href='login.html'" type="button">Log in</button>`;

           const sidePanelAuthButton = user
        ? `<button id="logOutBtn" class="login col-md-auto rounded-pill me-4" type="button">Log Out</button>`
        : `<button id="loginBtn" class="login col-md-auto rounded-pill" onclick="window.location.href='/pages/login.html'" type="button">Log in</button> 
           <button id="loginBtn" class="login col-md-auto rounded-pill" onclick="window.location.href='/pages/login.html#signup'" type="button">Sign up</button>`;

      this.innerHTML = `
            <nav class="navbar">
                <div class="navbar-main-container">
                  <div class="d-flex align-items-center gap-2" style="flex-shrink: 0;">
                        <button class="btn btn-primary" type="button" data-bs-toggle="offcanvas" data-bs-target="#mySidebar">
  <section><img id="side-panel" src="/public/images/menu.svg"></section>
</button>

<!-- The Sidebar (Offcanvas) -->
<div class="offcanvas offcanvas-start" id="mySidebar">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title">Menu</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
  </div>
  <div class="offcanvas-body">
    <!-- Your sidebar content goes here -->
    <ul class="list-group list-group-flush">
      <li><button id="logOutBtn" class="login bg-light" type="button">${sidePanelAuthButton}</button></li>
      <li class="list-group-item"><a href="#">Home</a></li>
      <li class="list-group-item"><a href="#">Profile</a></li>
      <li class="list-group-item"><a href="#">Settings</a></li>
    </ul>
  </div>
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
