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
    filtered = v === "All"
      ? [...bhajans]
      : bhajans.filter(b => (b.Category||"") === v);
    page = 1;
    render();
  };
}

function render() {
  const start = (page - 1) * perPage;
  const slice = filtered.slice(start, start + perPage);
  const results = document.getElementById("results");
  results.innerHTML = "";

  if (!slice.length) {
    results.innerHTML = `<p class="col-span-2 text-center">No bhajans found.</p>`;
  } else {
    slice.forEach(b => {
      const isFav = getFavorites().includes(b["Bhajan Name"]);
      const card = document.createElement("div");
      card.className = "rounded-lg p-4 shadow";
      card.style.backgroundColor = getComputedStyle(document.documentElement)
        .getPropertyValue('background') || '';
      card.innerHTML = `
        <div class="flex justify-between items-start">
          <h3 class="text-lg font-medium">${b["Bhajan Name"]}</h3>
          <button class="fav-star text-xl">${isFav ? '★' : '☆'}</button>
        </div>
        <p>${b.Lyrics.slice(0,80).replace(/\n/g,' ')}…</p>
        <p class="italic">${b["English Translation"].slice(0,80).replace(/\n/g,' ')}…</p>
        <button class="themed-btn w-full mt-3">View Details</button>
      `;
      card.querySelector('.fav-star').onclick = () => { toggleFavorite(b["Bhajan Name"]); render(); };
      card.querySelector('.themed-btn').onclick = () => openModal(b);
      results.appendChild(card);
    });
  }

  document.getElementById("pageInfo").textContent = `${page}/${Math.ceil(filtered.length / perPage)}`;
}

// SEARCH
document.getElementById("searchBar").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  filtered = bhajans.filter(b =>
    b["Bhajan Name"].toLowerCase().includes(q) ||
    b.Lyrics.toLowerCase().includes(q) ||
    b["English Translation"].toLowerCase().includes(q)
  );
  page = 1;
  render();
});

// PAGINATION
document.getElementById("prevPage").onclick = () => { if (page > 1) { page--; render(); } };
document.getElementById("nextPage").onclick = () => { if (page * perPage < filtered.length) { page++; render(); } };

// FAVORITES
function getFavorites() {
  return JSON.parse(localStorage.getItem("favs")||"[]");
}
function toggleFavorite(name) {
  let favs = getFavorites();
  if (favs.includes(name)) favs = favs.filter(n=>n!==name);
  else favs.push(name);
  localStorage.setItem("favs", JSON.stringify(favs));
}
favBtn.onclick = () => {
  const showingFavs = favBtn.textContent === "⭐";
  favBtn.textContent = showingFavs ? "All" : "⭐";
  filtered = showingFavs
    ? bhajans.filter(b=>getFavorites().includes(b["Bhajan Name"]))
    : [...bhajans];
  page = 1;
  render();
};

// RANDOM
document.getElementById("randomBtn").onclick = () => {
  const r = bhajans[Math.floor(Math.random()*bhajans.length)];
  openModal(r);
};

// DARK MODE
function setModeButton() {
  darkBtn.textContent = document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
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
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", async () => {
  // Hook up modal close
  document.getElementById("closeModal").onclick = closeModal;

  // Download & copy in modal
  document.getElementById("downloadBtn").onclick = () => {
    const title = document.getElementById("modalTitle").textContent;
    const b = bhajans.find(x => x["Bhajan Name"] === title);
    const blob = new Blob(
      [`${b["Bhajan Name"]}\n\n${b.Lyrics}\n\n${b["English Translation"]}`],
      { type: "text/plain" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${b["Bhajan Name"]}.txt`;
    a.click();
  };
  document.getElementById("copyBtn").onclick = () => {
    const title = document.getElementById("modalTitle").textContent;
    const b = bhajans.find(x => x["Bhajan Name"] === title);
    navigator.clipboard.writeText(
      `${b["Bhajan Name"]}\n\n${b.Lyrics}\n\n${b["English Translation"]}`
    );
  };

  // Init theme & data
  if (localStorage.getItem("dark")==="true") document.documentElement.classList.add("dark");
  setModeButton();
  await fetchBhajans();
});
