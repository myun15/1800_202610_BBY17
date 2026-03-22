import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCxGiPPhW7YqjnBZqMBK6QXaklCA2RGCdo",
  authDomain: "bby17-a60f8.firebaseapp.com",
  projectId: "bby17-a60f8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
  

async function seedRestaurants() {
  for (const restaurant of fakeRestaurants) {
    await addDoc(collection(db, "restaurants"), restaurant);
  }
  console.log("demo restaurants info Firebase");
}

seedRestaurants();
