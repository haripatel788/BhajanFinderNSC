let bhajans = [], filtered = [], page = 1, perPage = 10;
const darkBtn = document.getElementById("darkToggle");
const favBtn = document.getElementById("favoritesToggle");

async function fetchBhajans() {
  const res = await fetch("bhajans1.json");
  bhajans = await res.json();
  filtered = [...bhajans];
  buildCategorySelect();
  render();
}

function buildCategorySelect() {
  const select = document.getElementById("categorySelect");
  const cats = [...new Set(bhajans.map(b => b.Category || "Uncategorized"))];
  select.innerHTML = "<option>All</option>" + cats.map(c => `<option>${c}</option>`).join("");
  select.onchange = () => {
    const v = select.value;
    filtered = v === "All" ? [...bhajans] : bhajans.filter(b => (b.Category||"") === v);
    page = 1; render();
  };
}

function render() {
  const start = (page - 1) * perPage;
  const slice = filtered.slice(start, start + perPage);
  const results = document.getElementById("results");
  results.innerHTML = "";
results.innerHTML = "";

  if (!slice.length) {
results.innerHTML = `<p class="col-span-2 text-center text-[#555] dark:text-[#AAA]">No bhajans found.</p>`;
results.innerHTML = `<p class="col-span-2 text-center">No bhajans found.</p>`;
  } else {
    slice.forEach(b => {
      const isFav = getFavorites().includes(b["Bhajan Name"]);
      const card = document.createElement("div");
      card.className = "bg-white dark:bg-[#333] rounded-lg p-4 shadow";
      card.innerHTML = `
        <div class="flex justify-between items-start">
<h3 class="text-lg font-medium text-[#800000]">${b["Bhajan Name"]}</h3>
<button class="fav-star text-xl ${isFav ? 'text-yellow-400' : 'text-[#CCC]'}">★</button>
<h3 class="text-lg font-medium text-[#EEF1EF]">${b["Bhajan Name"]}</h3>
<button class="fav-star text-xl ${isFav ? 'text-yellow-400' : 'text-[#7389AE]'}">★</button>
        </div>
<p class="mt-2 text-sm text-[#555] dark:text-[#DDD]">${b.Lyrics.slice(0,80).replace(/\\n/g,' ')}…</p>
<p class="mt-1 italic text-sm text-[#777] dark:text-[#BBB]">${b["English Translation"].slice(0,80).replace(/\\n/g,' ')}…</p>
<button class="detail-btn mt-3 w-full p-2 border border-[#FF9933] rounded hover:bg-[#FF9933] hover:text-white">View Details</button>
<p class="mt-2 text-sm">${b.Lyrics.slice(0,80).replace(/\\n/g,' ')}…</p>
<p class="mt-1 italic text-sm">${b["English Translation"].slice(0,80).replace(/\\n/g,' ')}…</p>
<button class="detail-btn mt-3 w-full p-2 border border-[#7389AE] rounded hover:bg-[#CE8964] hover:text-white">View Details</button>
      `;
      card.querySelector(".fav-star").onclick = () => { toggleFavorite(b["Bhajan Name"]); render(); };
      card.querySelector(".detail-btn").onclick = () => openModal(b);
      results.appendChild(card);
    });
  }
}

// SEARCH
document.getElementById("searchBar").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  filtered = bhajans.filter(b =>
    b["Bhajan Name"].toLowerCase().includes(q) ||
    b.Lyrics.toLowerCase().includes(q) ||
    b["English Translation"].toLowerCase().includes(q)
  );
  page = 1; render();
});

// PAGINATION
document.getElementById("prevPage").onclick = () => { if(page>1){ page--; render(); } };
document.getElementById("nextPage").onclick = () => { if(page*perPage<filtered.length){ page++; render(); } };

// FAVORITES
function getFavorites() {
  return JSON.parse(localStorage.getItem("favs")||"[]");
}
function toggleFavorite(name) {
  let favs = getFavorites();
  favs = favs.includes(name) ? favs.filter(n=>n!==name) : [...favs,name];
  localStorage.setItem("favs", JSON.stringify(favs));
}
favBtn.onclick = () => {
  const showing = favBtn.textContent === "⭐";
  favBtn.textContent  = showing ? "All" : "⭐";
  filtered = showing
    ? bhajans.filter(b=>getFavorites().includes(b["Bhajan Name"]))
    : [...bhajans];
  page = 1; render();
};

// RANDOM
document.getElementById("randomBtn").onclick = () => {
  const r = bhajans[Math.floor(Math.random()*bhajans.length)];
  openModal(r);
};

// DARK MODE
function setModeButton() {
  const dark = document.documentElement.classList.contains("dark");
  darkBtn.textContent = dark ? "☀️" : "🌙";
}
darkBtn.onclick = () => {
  const html = document.documentElement;
  html.classList.toggle("dark");
  localStorage.setItem("dark", html.classList.contains("dark"));
  setModeButton();
};

// MODAL
function openModal(b) {
  document.getElementById("modalTitle").textContent = b["Bhajan Name"];
  document.getElementById("modalLyrics").textContent = b.Lyrics;
  document.getElementById("modalTranslation").textContent = b["English Translation"];
  document.getElementById("modalAudio").innerHTML =
    `<iframe class="w-full h-40" src="${b["YouTube Link"].replace("watch?v=","embed/")}" frameborder="0" allowfullscreen></iframe>`;
  document.getElementById("favModal").onclick = () => { toggleFavorite(b["Bhajan Name"]); openModal(b); render(); };
  document.getElementById("downloadBtn").onclick = () => downloadText(b);
  document.getElementById("copyBtn").onclick = () => navigator.clipboard.writeText(
    `${b["Bhajan Name"]}\n\n${b.Lyrics}\n\n${b["English Translation"]}`
  );
  document.getElementById("modal").classList.remove("hidden");
}
document.getElementById("closeModal").onclick = () => {
  document.getElementById("modal").classList.add("hidden");
};
function downloadText(b) {
  const blob = new Blob(
    [`${b["Bhajan Name"]}\n\n${b.Lyrics}\n\n${b["English Translation"]}`],
    { type: "text/plain" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = b["Bhajan Name"] + ".txt";
  a.click();
}

// INIT
document.addEventListener("DOMContentLoaded", async () => {
  if (localStorage.getItem("dark")==="true") document.documentElement.classList.add("dark");
  setModeButton();
  await fetchBhajans();
});
