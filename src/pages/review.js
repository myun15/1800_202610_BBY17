import { collection, addDoc } from "firebase/firestore";
import { db } from "/src/helper/firebaseConfig.js";

function initReviewForm() {
  const submitBtn = document.getElementById("submit");
  if (!submitBtn) return;

  submitBtn.addEventListener("click", () => {
    const nameEl = document.getElementById("restaurantname");
    const commentEl = document.getElementById("comment");

    if (!nameEl || !nameEl.value) {
      alert("Enter Restaurant Name.");
      return;
    }

    const reviewRef = collection(db, "reviews");

    addDoc(reviewRef, {
      restaurant: nameEl.value,
      comment: commentEl?.value || "",
    });

    window.location.href = "main.html";
  });
}

initReviewForm();
