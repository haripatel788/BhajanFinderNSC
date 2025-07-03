let bhajans = [];
let filtered = [];
let page = 1;
const perPage = 10;
let showFavs = false;

async function fetchBhajans() {
  const res = await fetch("bhajans1.json");
  bhajans = await res.json();
  filtered = [...bhajans];
  buildCategoryFilters();
  render();
}

function buildCategoryFilters() {
  const cats = [...new Set(bhajans.map(b => (b.Category || "Uncategorized")))];
  const container = document.getElementById("categoryFilters");
  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.className = "px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm";
    btn.onclick = () => {
      filtered = bhajans.filter(b => (b.Category||"").toLowerCase() === cat.toLowerCase());
      page = 1;
      render();
    };
    container.appendChild(btn);
  });
  const all = document.createElement("button");
  all.textContent = "All";
  all.className = "px-2 py-1 bg-red-200 dark:bg-red-700 rounded text-sm";
  all.onclick = () => { filtered = [...bhajans]; page = 1; render(); };
  container.prepend(all);
}

function render() {
  const start = (page-1)*perPage;
  const slice = filtered.slice(start, start + perPage);
  const results = document.getElementById("results");
  results.innerHTML = "";

  if (!slice.length) {
    results.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400">No bhajans found.</p>`;
  } else {
    slice.forEach(b => {
      const card = document.createElement("div");
      const isFav = getFavorites().includes(b["Bhajan Name"]);
      card.className = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow relative";
      card.innerHTML = `
        <button class="fav-star absolute top-3 right-3 text-xl ${isFav?'text-yellow-400':'text-gray-400'}">
          ★
        </button>
        <h3 class="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">${b["Bhajan Name"]}</h3>
        <p class="text-gray-700 dark:text-gray-300 mb-2">${b["Lyrics"].substring(0,100).replace(/\n/g,' ')}…</p>
        <p class="italic text-gray-600 dark:text-gray-400 mb-4">${b["English Translation"].substring(0,100).replace(/\n/g,' ')}…</p>
        <button class="detail-btn px-3 py-1 bg-blue-500 text-white rounded">View</button>
      `;
      // star toggle
      card.querySelector(".fav-star").onclick = () => {
        toggleFavorite(b["Bhajan Name"]);
        render();
      };
      // detail
      card.querySelector(".detail-btn").onclick = () => openModal(b);
      results.appendChild(card);
    });
  }

  document.getElementById("pageInfo").textContent =
    `Page ${page} of ${Math.ceil(filtered.length / perPage)}`;
}

function searchBhajans(q) {
  const ql = q.toLowerCase();
  filtered = bhajans.filter(b =>
    b["Bhajan Name"].toLowerCase().includes(ql) ||
    b["Lyrics"].toLowerCase().includes(ql) ||
    b["English Translation"].toLowerCase().includes(ql)
  );
  page = 1;
  render();
}

function prevPage() { if (page>1){ page--; render(); } }
function nextPage() { if (page*perPage < filtered.length){ page++; render(); } }

function getFavorites() {
  return JSON.parse(localStorage.getItem("favs")||"[]");
}
function toggleFavorite(name) {
  let favs = getFavorites();
  if (favs.includes(name)) favs = favs.filter(n=>n!==name);
  else favs.push(name);
  localStorage.setItem("favs", JSON.stringify(favs));
}

function showOnlyFavs() {
  showFavs = !showFavs;
  document.getElementById("favoritesToggle").textContent =
    showFavs ? "All Bhajans" : "Favorites";
  filtered = showFavs
    ? bhajans.filter(b=>getFavorites().includes(b["Bhajan Name"]))
    : [...bhajans];
  page = 1; 
  render();
}

function openModal(b) {
  document.getElementById("modalTitle").textContent = b["Bhajan Name"];
  document.getElementById("modalLyrics").textContent = b["Lyrics"];
  document.getElementById("modalTranslation").textContent = b["English Translation"];
  document.getElementById("modalAudio").innerHTML =
    `<iframe width="100%" height="200" src="${b["YouTube Link"].replace("watch?v=","embed/")}" frameborder="0" allowfullscreen></iframe>`;
  document.getElementById("favModal").onclick = ()=>{
    toggleFavorite(b["Bhajan Name"]);
    openModal(b);
    render();
  };
  document.getElementById("downloadBtn").onclick = ()=>downloadText(b);
  document.getElementById("copyBtn").onclick = ()=>navigator.clipboard.writeText(
    `${b["Bhajan Name"]}\n\n${b["Lyrics"]}\n\n${b["English Translation"]}`
  );
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function downloadText(b) {
  const blob = new Blob(
    [`${b["Bhajan Name"]}\n\n${b["Lyrics"]}\n\n${b["English Translation"]}`],
    { type: "text/plain" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = b["Bhajan Name"] + ".txt";
  a.click();
  URL.revokeObjectURL(url);
}

function randomBhajan() {
  const r = bhajans[Math.floor(Math.random()*bhajans.length)];
  openModal(r);
}

function toggleDark() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("dark", document.documentElement.classList.contains("dark"));
}

document.addEventListener("DOMContentLoaded", async () => {
  if (localStorage.getItem("dark")==="false") document.documentElement.classList.remove("dark");
  if (localStorage.getItem("dark")==="true") document.documentElement.classList.add("dark");

  await fetchBhajans();
  document.getElementById("searchBar").addEventListener("input", e=>searchBhajans(e.target.value));
  document.getElementById("prevPage").onclick = prevPage;
  document.getElementById("nextPage").onclick = nextPage;
  document.getElementById("favoritesToggle").onclick = showOnlyFavs;
  document.getElementById("randomBtn").onclick = randomBhajan;
  document.getElementById("closeModal").onclick = closeModal;
  document.getElementById("darkToggle").onclick = toggleDark;
});
