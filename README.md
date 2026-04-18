# TimesUp

## Overview

“TimesUp” provides real-time crowd insights for customers, restaurants, and vendors, helping them manage wait times and preparation, while also addressing overcrowding and uneven customer distribution during the FIFA event in Vancouver by guiding users to less crowded venues and supporting local businesses.

Developed for the COMP 1800 course, this project applies user-centred design principles, integrates mapping features, and utilizes Firebase backend services to store user favourites and recent activity.

---

## Features

- Browse a map of current restaurants with images and details
- A legend is provided to indicate busyness levels
- Use the update button to update the busyness of the restaurant in real time
- View the updated timestamp of the restaurant on the home page
- Mark and unmark restaurants as favourites in both the home page and the featured vendor page
- When you click on the “View Details” button, the restaurant and vendor will appear on the recent page
- View a list of favourite restaurants and vendors
- Responsive design for both desktop and mobile

---

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend**: Firebase for hosting
- **Database**: Firestore, API

---

## Usage


To run the application locally:


1.  **Clone** the repository.
2.  **Install dependencies** by running `npm install` in the project root directory.
3.  **Start the development server** by running the command: `npm run dev`.
4.  Open your browser and visit the local address shown in your terminal (usually `http://localhost:5173` or similar).


Once the application is running:


1.  Browse the list of restaurant maps displayed on the main page.
2.  Click the heart icon (or similar) to mark a restaurant and vendor as a favorite.
3.  View your favorite restaurants and vendors in the favorites section.


---

## Project Structure

```
1800_202610_bby17/
├── pages/
│  ├── favorites.html
│  ├── featuredRestaurants.html
│  ├── login.html
│  ├── recent.html
│  └── restaurant-detail.html
├── public/
│  ├── data
│      └── food-vendors.json
│  ├──images
│      ├── logo.png
│      ├── logo_1.jpg
│      ├── logo_2.jpg
│      ├── menu.svg
│      ├── pin-fill-sharp-circle-634-svgrepo-com.svg
│      └── restaurant.jpg
├── scripts/
│   └── fetch-yelp-images.js
│
├── src/
│   ├── components/
│   │   ├── site-footer.js
│   │   └── site-navbar.js
│   │
│   ├── helper/
│   │   ├── authentication.js
│   │   ├── firebaseConfig.js
│   │   └── utlis.js
│   │
│   ├── pages/
│   │   ├── favorites.js
│   │   ├── featureVendor.js
│   │   ├── home.js
│   │   ├── login.js
│   │   ├── recent.js
│   │   └── restaurantDetail.js
│   │
│   ├── styles/
│   │   └── style.css
│   │
│   └── app.js
│
├── .gitignore
├── README.md
├── index.html
├── package.json
└── vite.config.js



## Contributors


- **Wenting Yang** - BCIT CST Student with a passion for interactive technology and AI. Fun facts: snowboarding in winter.


- **Marcus Leung** - BCIT CST Student with a passion for coding user-friendly websites


- **Matthew Yun** - BCIT CST Student with a passion for programming and photography. Fun Fact: I like pizza, sushi, and burgers.


- **Fardis Valipour** - BCIT CST Student with a passion for teaching piano for kids and I love doing adventurous activities.


---


## Acknowledgments


- restaurant data and images from Yelp, and vendors from the open data of the city of Vancouver https://opendata.vancouver.ca/explore/dataset/food-vendors/information/ are for demonstration purposes only.
- Code snippets were adapted from COMP 1800 demos.
- Logo generation initially sourced from [ace.ai](https://app.ace.ai/) and vendor images from online research.


---


## Limitations and Future Work


### Limitations


- Limited vendor details (e.g., images, addresses and detailed information in the vendor).
- Accessibility and special request features can be further improved.


### Future Work


- Implement map view and directions.
- Add filtering and sorting options on the home page, like a featured vendor page (e.g., by select food types, busyness and special requests).
- Create a dark mode for better usability in low-light conditions.
- notify the users when they are close to the restaurant, so they can receive or update the status.


---
