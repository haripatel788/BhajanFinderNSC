// —— Firebase imports ——
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getAnalytics }  from "https://www.gstatic.com/firebasejs/10.3.1/firebase-analytics.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  child,
  get
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";

// —— Firebase config + init ——
const firebaseConfig = {
  apiKey: "AIzaSyCrRALzFPJipqB_fcY4FxjZlOz5cDUvgf0",
  authDomain: "bhajanfinder.firebaseapp.com",
  databaseURL: "https://bhajanfinder-default-rtdb.firebaseio.com",
  projectId: "bhajanfinder",
  storageBucket: "bhajanfinder.firebasestorage.app",
  messagingSenderId: "645890810282",
  appId: "1:645890810282:web:92042c774a3c00b6af4bd3",
  measurementId: "G-R3WL0RMHSX"
};
const app       = initializeApp(firebaseConfig);
getAnalytics(app);
const db        = getDatabase(app);

// —— Globals & refs ——
let bhajans = [], filtered = [], page = 1, perPage = 12;
let username, firstName, lastName, favorites = [];

const userGreeting  = document.getElementById("userGreeting");
const logoutBtn     = document.getElementById("logoutBtn");
const searchBar     = document.getElementById("searchBar");
const dataList      = document.getElementById("bhajan-list");
const catSelect     = document.getElementById("categorySelect");
const resultsEl     = document.getElementById("results");
const pageInfo      = document.getElementById("pageInfo");
const prevPageBtn   = document.getElementById("prevPage");
const nextPageBtn   = document.getElementById("nextPage");
const darkToggle    = document.getElementById("darkToggle");
const showFavsBtn   = document.getElementById("showFavsBtn");
const navHome       = document.getElementById("navHome");
const navRandom     = document.getElementById("navRandom");
const modal         = document.getElementById("modal");
const closeModalBtn = document.getElementById("closeModal");
const modalTitle    = document.getElementById("modalTitle");
const modalLyrics   = document.getElementById("modalLyrics");
const modalTrans    = document.getElementById("modalTranslation");
const modalAudio    = document.getElementById("modalAudio");
const favModalBtn   = document.getElementById("favModal");
const dlBtn         = document.getElementById("downloadBtn");
const copyBtn       = document.getElementById("copyBtn");

// —— Parse URL params or fallback to localStorage ——
(function loadUser() {
  const params = new URLSearchParams(window.location.search);
  username  = params.get("user")  || localStorage.getItem("bf_user");
  firstName = params.get("first") || localStorage.getItem("bf_first");
  lastName  = params.get("last")  || localStorage.getItem("bf_last");

  if (!username || !firstName || !lastName) {
    return window.location.replace("index.html");
  }
  // persist
  localStorage.setItem("bf_user",  username);
  localStorage.setItem("bf_first", firstName);
  localStorage.setItem("bf_last",  lastName);

  userGreeting.textContent = `Jay Swaminarayan, ${firstName} ${lastName}`;
})();

// —— Logout clears and back to login ——
logoutBtn.onclick = () => {
  localStorage.removeItem("bf_user");
  localStorage.removeItem("bf_first");
  localStorage.removeItem("bf_last");
  window.location.replace("index.html");
};

// —— Theme toggle & emoji ——
function updateToggleEmoji() {
  darkToggle.textContent = document.documentElement.classList.contains("dark")
    ? "☀️" : "🌙";
}
darkToggle.onclick = () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("dark", document.documentElement.classList.contains("dark"));
  updateToggleEmoji();
};
if (localStorage.getItem("dark")==="true") {
  document.documentElement.classList.add("dark");
}
updateToggleEmoji();

// —— Fetch user’s favorites from DB ——
function loadFavorites() {
  onValue(ref(db, `users/${username}/favorites`), snap => {
    favorites = snap.val() || [];
    render();
  });
}

// —— Main init ——
async function initApp() {
  await fetchBhajans();
  setupListeners();
  loadFavorites();
}

// —— Fetch bhajans JSON ——
async function fetchBhajans() {
  try {
    const res = await fetch("bhajans1.json");
    if (!res.ok) throw new Error("Failed to load bhajans");
    bhajans  = await res.json();
    filtered = [...bhajans];
    buildCategorySelect();
    buildDatalist();
    render();
  } catch (e) {
    resultsEl.innerHTML = `<p class="col-span-3 text-center text-red-500">${e.message}</p>`;
  }
}

// —— UI builders & renderers ——
function buildCategorySelect() {
  const cats = [...new Set(bhajans.map(b=>b.Category||"Uncategorized"))];
  catSelect.innerHTML = `<option>All Categories</option>` +
    cats.map(c=>`<option>${c}</option>`).join("");
  catSelect.onchange = () => {
    filtered = catSelect.value==="All Categories"
      ? [...bhajans]
      : bhajans.filter(b=>(b.Category||"")===catSelect.value);
    page = 1; render();
  };
}

function buildDatalist() {
  dataList.innerHTML = bhajans
    .map(b=>`<option value="${b["Bhajan Name"]}">`)
    .join("");
}

function render() {
  resultsEl.innerHTML = "";
  const start = (page-1)*perPage, slice = filtered.slice(start, start+perPage);
  if (!slice.length) {
    resultsEl.innerHTML = `<p class="col-span-3 text-center text-gray-500">No bhajans found.</p>`;
  } else {
    slice.forEach(b => {
      const isFav = favorites.includes(b["Bhajan Name"]);
      const card = document.createElement("div");
      card.innerHTML=`
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-medium">${b["Bhajan Name"]}</h3>
          <button class="fav-star text-xl">${isFav?'★':'☆'}</button>
        </div>
        <p class="text-sm mb-1">${b.Lyrics.slice(0,80).replace(/\n/g,' ')}…</p>
        <p class="italic text-xs mb-3">${b["English Translation"].slice(0,80).replace(/\n/g,' ')}…</p>
        <button class="w-full px-3 py-2 border border-gray-300 rounded view-btn">View Details</button>
      `;
      card.querySelector(".fav-star").onclick = () => toggleFavorite(b["Bhajan Name"]);
      card.querySelector(".view-btn").onclick = () => openModal(b);
      resultsEl.appendChild(card);
    });
  }
  pageInfo.textContent = `${page} / ${Math.ceil(filtered.length / perPage)}`;
}

// —— Pagination, search, favorites, random, home ——
function setupListeners() {
  prevPageBtn .onclick = ()=>{ if(page>1){page--; render();}};
  nextPageBtn .onclick = ()=>{ if(page*perPage<filtered.length){page++;render();}};
  searchBar   .oninput = e=>{
    const q = e.target.value.toLowerCase();
    filtered = bhajans.filter(b=>
      b["Bhajan Name"].toLowerCase().includes(q) ||
      b.Lyrics.toLowerCase().includes(q) ||
      b["English Translation"].toLowerCase().includes(q)
    );
    page=1; render();
  };
  showFavsBtn .onclick = ()=>{
    filtered = favorites.length
      ? bhajans.filter(b=>favorites.includes(b["Bhajan Name"]))
      : [...bhajans];
    page=1; render();
  };
  navRandom   .onclick = ()=>{
    const r = bhajans[Math.floor(Math.random()*bhajans.length)];
    openModal(r);
  };
  navHome     .onclick = ()=>{
    filtered = [...bhajans];
    page = 1;
    render();
  };
  closeModalBtn.onclick = ()=>modal.classList.add("hidden");
}

// —— Toggle & persist favorite in DB ——
function toggleFavorite(name) {
  const updated = favorites.includes(name)
    ? favorites.filter(x=>x!==name)
    : [...favorites, name];
  set(ref(db, `users/${username}/favorites`), updated);
}

// —— Modal controls ——
function openModal(b) {
  modalTitle.textContent   = b["Bhajan Name"];
  modalLyrics.textContent  = b.Lyrics;
  modalTrans.textContent   = b["English Translation"];
  modalAudio.innerHTML     =
    `<iframe class="w-full h-40" src="${b["YouTube Link"].replace("watch?v=","embed/")}" frameborder="0" allowfullscreen></iframe>`;
  favModalBtn.textContent  = favorites.includes(b["Bhajan Name"]) ? "★ Unfavorite" : "☆ Favorite";
  favModalBtn.onclick      = ()=>toggleFavorite(b["Bhajan Name"]);
  dlBtn.onclick            = ()=>{
    const blob = new Blob([`${b["Bhajan Name"]}\n\n${b.Lyrics}\n\n${b["English Translation"]}`], {type:"text/plain"});
    const a = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `${b["Bhajan Name"]}.txt`;
    a.click();
  };
  copyBtn.onclick          = ()=>navigator.clipboard.writeText(
    `${b["Bhajan Name"]}\n\n${b.Lyrics}\n\n${b["English Translation"]}`
  );
  modal.classList.remove("hidden");
}

// —— Kick off the app! ——
document.addEventListener("DOMContentLoaded", initApp);
