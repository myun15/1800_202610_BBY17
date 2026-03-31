import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        home: resolve(__dirname, "home.html"),
        login: resolve(__dirname, "login.html"),
        restaurant: resolve(__dirname, "reservation.html"),
        restaurantDetail: resolve(__dirname, "restaurant-detail.html"),
        favorites: resolve(__dirname, "favorites.html"),
        review: resolve(__dirname, "review.html"),
        recent: resolve(__dirname, "recent.html"),
      },
    },
  },
});
