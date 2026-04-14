import { onAuthReady, logoutUser } from "/src/helper/authentication.js";
import { collection, getDocs } from "firebase/firestore";
import { db } from "/src/helper/firebaseConfig.js";

let restaurantCache = null;

async function getRestaurants() {
  if (restaurantCache) return restaurantCache;
  const snapshot = await getDocs(collection(db, "restaurants"));
  restaurantCache = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return restaurantCache;
}

function escapeAttr(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

class SiteNavbar extends HTMLElement {
  constructor() {
    super();
    this.renderNavbar();
  }

  renderNavbar() {
    onAuthReady((user) => {
      const href = "/index.html";
      const authButton = user
        ? `<button class="login col-md-auto rounded-pill me-4 btn-danger" 
               onclick="logoutUser()" 
               type="button">Log Out</button>`
        : `<button class="login col-md-auto rounded-pill" 
               onclick="window.location.href='/pages/login.html'" 
               type="button">Log in</button> 
       <button class="login col-md-auto rounded-pill" 
               onclick="window.location.href='/pages/login.html#signup'" 
               type="button">Sign up</button>`;

      const sidePanelAuthButton = user
        ? `<button id="logOutBtn" class="login col-md-auto rounded-pill me-4" type="button">Log Out</button>`
        : `<button id="loginBtn" class="login col-md-auto rounded-pill" onclick="window.location.href='/pages/login.html'" type="button">Log in</button> 
           <button id="loginBtn" class="login col-md-auto rounded-pill" onclick="window.location.href='/pages/login.html#signup'" type="button">Sign up</button>`;

      this.innerHTML = `
            <nav class="navbar">
                <div class="navbar-main-container">
                  <div class="d-flex align-items-center gap-2" style="flex-shrink: 0;">
                        <button class="btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#mySidebar">
                          <section><img id="side-panel" src="/public/images/menu.svg"></section>
                        </button>
                        <div class="offcanvas offcanvas-start" id="mySidebar">
                          <div class="offcanvas-header">
                            <h5 class="offcanvas-title">Menu</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
                          </div>
                          <div class="offcanvas-body">
                            <ul class="list-group list-group-flush">
                              <li>${sidePanelAuthButton}</li>
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
                    <div class="d-flex navbar-search-wrapper position-relative">
                        <input
                        id="restaurant-search-input"
                        type="text"
                        class="address-input form-control px-5"
                        placeholder="Search restaurant name"
                        autocomplete="off"
                        />
                        <button id="restaurant-search-btn" class="search-button btn btn-danger">Search</button>
                        <ul id="restaurant-search-dropdown" class="search-dropdown" hidden></ul>
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

      const searchBtn = this.querySelector("#restaurant-search-btn");
      const searchInput = this.querySelector("#restaurant-search-input");
      const dropdown = this.querySelector("#restaurant-search-dropdown");

      const triggerSearch = (term) => {
        const searchTerm = (term ?? searchInput.value).trim();
        if (!searchTerm) return;
        window.dispatchEvent(
          new CustomEvent("restaurant-search", { detail: { searchTerm } })
        );
        hideDropdown();
      };

      const hideDropdown = () => {
        if (!dropdown) return;
        dropdown.hidden = true;
        dropdown.innerHTML = "";
      };

      const renderDropdown = (matches) => {
        if (!dropdown) return;
        if (matches.length === 0) {
          hideDropdown();
          return;
        }
        dropdown.innerHTML = matches
          .map((r) => {
            const sub = [r.address, r.city].filter(Boolean).join(", ");
            return `
              <li class="search-dropdown-item" data-name="${escapeAttr(r.name)}">
                <span class="search-dropdown-name">${escapeAttr(r.name || "Unknown")}</span>
                <span class="search-dropdown-sub">${escapeAttr(sub)}</span>
              </li>`;
          })
          .join("");
        dropdown.hidden = false;
      };

      if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", () => triggerSearch());

        searchInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            triggerSearch();
          } else if (e.key === "Escape") {
            hideDropdown();
          }
        });

        searchInput.addEventListener("input", async () => {
          const term = searchInput.value.trim().toLowerCase();
          if (!term) {
            hideDropdown();
            return;
          }
          try {
            const restaurants = await getRestaurants();
            const matches = restaurants
              .filter((r) => {
                const haystack = [r.name, r.address, r.city]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();
                return haystack.includes(term);
              })
              .slice(0, 8);
            renderDropdown(matches);
          } catch (err) {
            console.error("Search dropdown failed:", err);
          }
        });

        searchInput.addEventListener("focus", () => {
          if (searchInput.value.trim()) {
            searchInput.dispatchEvent(new Event("input"));
          }
        });

        dropdown?.addEventListener("mousedown", (e) => {
          const item = e.target.closest(".search-dropdown-item");
          if (!item) return;
          const name = item.dataset.name;
          searchInput.value = name;
          triggerSearch(name);
        });

        document.addEventListener("click", (e) => {
          if (!this.contains(e.target)) hideDropdown();
        });
      }
    });
  }
}

customElements.define("site-navbar", SiteNavbar);
