import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    server: {
      proxy: {
        "/api/yelp": {
          target: "https://api.yelp.com/v3",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/yelp/, ""),
          headers: {
            Authorization: `Bearer ${env.VITE_YELP_API_KEY}`,
          },
        },
      },
    },
    build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "pages/login.html"),
        restaurant: resolve(__dirname, "pages/reservation.html"),
        restaurantDetail: resolve(__dirname, "pages/restaurant-detail.html"),
        favorites: resolve(__dirname, "pages/favorites.html"),
        review: resolve(__dirname, "pages/review.html"),
        recent: resolve(__dirname, "pages/recent.html"),
      },
    },
  },
  };
});
