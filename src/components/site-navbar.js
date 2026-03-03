import { onAuthStateChanged } from "firebase/auth";
import { auth } from "/src/helper/firebaseConfig.js";
import { logoutUser } from "/src/helper/authentication.js";

class SiteNavbar extends HTMLElement {
  constructor() {
    super();
    this.renderNavbar();
  }

  renderNavbar() {
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
            <a class="navbar-brand col-md-auto" href="./index.html">
                Website Name
            </a>
            </div>
            <div class="d-flex flex-row gap-3 pe-5">
            <button id="loginBtn" class="login col-md-auto rounded-pill" onclick="window.location.href='login.html'"
                type="button">Log in</button>
            <button id="signInBtn" class="sign-up col-md-auto rounded-pill" onclick="window.location.href='login.html'"
                type="button">Sign up</button>
            <button id="logOutBtn" class="login col-md-auto rounded-pill me-4" type="button">Log Out</button>
            </div>
        </nav>
    `;
  }
}

customElements.define("site-navbar", SiteNavbar);