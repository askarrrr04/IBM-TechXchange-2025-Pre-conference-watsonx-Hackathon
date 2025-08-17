// ---- State ----
let map, markerLayer;
let currentRoute = null;
let userMarker = null;
let destMarker = null;
let searchMarker = null;
let selectedBin = null;
let currentFilterType = "";
let currentLang = localStorage.getItem("lang") || "ru";
let favorites = loadFavorites();
let bins = []; // Динамически загружаемые данные

// ---- i18n ----
const i18n = {
  ru: { title: "Карта пунктов приёма отходов", searchPlaceholder: "Поиск адреса или пункта...", search: "Поиск", filter: "Фильтр:", types: "Типы приёма:", schedule: "График работы:", desc: "Описание:", avgRating: "Средняя оценка:", rateHint: "Нажмите на звезду, чтобы поставить оценку", buildRoute: "Построить маршрут сюда", deleteRoute: "Удалить маршрут", close: "Закрыть", reviews: "Отзывы", send: "Отправить", favorites: "Избранное", lang: "Язык:", google: "Google Maps", yandex: "Яндекс.Карты", photo: "Определить по фото (ИИ)" },
  kk: { title: "Қалдық қабылдау пункттерінің картасы", searchPlaceholder: "Мекенжай немесе пункт атауы...", search: "Іздеу", filter: "Сүзгі:", types: "Қабылдайтын түрлері:", schedule: "Жұмыс кестесі:", desc: "Сипаттама:", avgRating: "Орташа бағасы:", rateHint: "Бағалау үшін жұлдызды басыңыз", buildRoute: "Маршрут құру", deleteRoute: "Маршрутты жою", close: "Жабу", reviews: "Пікірлер", send: "Жіберу", favorites: "Таңдаулылар", lang: "Тіл:", google: "Google Maps", yandex: "Yandex Карталар", photo: "Фото бойынша анықтау (AI)" },
  en: { title: "Recycling Points Map", searchPlaceholder: "Search address or point...", search: "Search", filter: "Filter:", types: "Accepted types:", schedule: "Working hours:", desc: "Description:", avgRating: "Average rating:", rateHint: "Click a star to rate", buildRoute: "Build route here", deleteRoute: "Clear route", close: "Close", reviews: "Reviews", send: "Send", favorites: "Favorites", lang: "Language:", google: "Google Maps", yandex: "Yandex Maps", photo: "Detect from photo (AI)" }
};
function t(key) { return i18n[currentLang][key] || key; }
function renderTexts() {
  document.getElementById("appTitle").textContent = t("title");
  document.getElementById("searchInput").placeholder = t("searchPlaceholder");
  document.getElementById("searchButton").textContent = t("search");
  document.getElementById("filterLabel").textContent = t("filter");
  document.getElementById("typesLabel").textContent = t("types");
  document.getElementById("scheduleLabel").textContent = t("schedule");
  document.getElementById("descLabel").textContent = t("desc");
  document.getElementById("avgLabel").textContent = t("avgRating");
  document.getElementById("rateHint").textContent = t("rateHint");
  document.getElementById("routeButton").textContent = t("buildRoute");
  document.getElementById("clearRouteButton").textContent = t("deleteRoute");
  document.getElementById("hideInfoButton").textContent = t("close");
  document.getElementById("commentsTitle").textContent = t("reviews");
  document.getElementById("submitComment").textContent = t("send");
  document.getElementById("favoritesBtnText").textContent = t("favorites");
  document.getElementById("langLabel").textContent = t("lang");
  document.getElementById("openGoogle").textContent = t("google");
  document.getElementById("openYandex").textContent = t("yandex");
  document.getElementById("photoButton").textContent = t("photo");
}

// ---- Ratings storage ----
function ratingKey(binId) { return `ratings:${binId}`; }
function getRatings(binId) {
  try {
    const raw = localStorage.getItem(ratingKey(binId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function addRating(binId, value) {
  const arr = getRatings(binId);
  arr.push(value);
  localStorage.setItem(ratingKey(binId), JSON.stringify(arr));
}
function getAverage(binId) {
  const arr = getRatings(binId);
  if (!arr.length) return { avg: 0, count: 0 };
  const sum = arr.reduce((a,b) => a + b, 0);
  return { avg: sum / arr.length, count: arr.length };
}
function updateRatingUI(binId) {
  const { avg, count } = getAverage(binId);
  document.getElementById("avgScore").textContent = count ? avg.toFixed(1) : "—";
  document.getElementById("ratingCount").textContent = count ? `(${count})` : "";
  document.querySelectorAll("#ratingStars button").forEach(btn => btn.classList.remove("active"));
  if (count) {
    const avgRounded = Math.round(avg);
    document.querySelectorAll(`#ratingStars button`).forEach(btn => {
      if (Number(btn.dataset.value) <= avgRounded) btn.classList.add("active");
    });
  }
}

// ---- Comments storage ----
function commentsKey(binId) { return `comments:${binId}`; }
function getComments(binId) {
  try {
    const raw = localStorage.getItem(commentsKey(binId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function addComment(binId, text) {
  const arr = getComments(binId);
  arr.unshift({ text, ts: Date.now() });
  localStorage.setItem(commentsKey(binId), JSON.stringify(arr.slice(0, 50)));
}
function renderComments(binId) {
  const ul = document.getElementById("commentsList");
  ul.innerHTML = "";
  const arr = getComments(binId).slice(0, 10);
  if (!arr.length) return;
  arr.forEach(c => {
    const li = document.createElement("li");
    li.className = "comment";
    const d = new Date(c.ts);
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = d.toLocaleString();
    const text = document.createElement("div");
    text.textContent = c.text;
    li.appendChild(meta);
    li.appendChild(text);
    ul.appendChild(li);
  });
}

// ---- Favorites storage ----
function loadFavorites() {
  try {
    const raw = localStorage.getItem("favorites");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveFavorites() { localStorage.setItem("favorites", JSON.stringify(favorites)); }
function isFavorite(id) { return favorites.includes(id); }
function toggleFavorite(id) {
  if (isFavorite(id)) favorites = favorites.filter(x => x !== id);
  else favorites.push(id);
  saveFavorites();
  updateFavoriteButton();
  renderFavoritesDropdown();
}
function updateFavoriteButton() {
  const btn = document.getElementById("favoriteButton");
  if (!selectedBin) { btn.classList.remove("active"); btn.disabled = true; return; }
  btn.disabled = false;
  if (isFavorite(selectedBin.id)) btn.classList.add("active");
  else btn.classList.remove("active");
}
function renderFavoritesDropdown() {
  const dd = document.getElementById("favoritesDropdown");
  dd.innerHTML = "";
  if (!favorites.length) {
    const div = document.createElement("div");
    div.className = "fav-empty";
    div.textContent = "Пока пусто";
    dd.appendChild(div);
    return;
  }
  favorites.forEach(id => {
    const bin = bins.find(b => b.id === id);
    if (!bin) return;
    const item = document.createElement("div");
    item.className = "fav-item";
    item.textContent = bin.name;
    item.addEventListener("click", () => {
      dd.classList.remove("open");
      focusBin(bin);
    });
    dd.appendChild(item);
  });
}

// ---- Map / Markers ----
async function fetchBins() {
  try {
    const response = await fetch('http://localhost:8080/locations');
    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.error || 'Failed to fetch locations');
    }
    return result.data.map(loc => ({
      id: loc.id,
      name: loc.name,
      lat: loc.latitude,
      lon: loc.longitude,
      types: loc.waste_types,
      schedule: 'Не указано', // Замените на реальное расписание при интеграции
      description: loc.address
    }));
  } catch (error) {
    console.error('Error fetching locations:', error);
    alert('Не удалось загрузить пункты приёма: ' + error.message);
    return [];
  }
}

async function fetchSchedule() {
  try {
    const response = await fetch('http://localhost:8080/schedule');
    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.error || 'Failed to fetch schedule');
    }
    return result.data;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return [];
  }
}

async function initMap() {
  map = L.map("map").setView([51.1694, 71.4491], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  
  bins = await fetchBins();
  renderMarkers();

  const locateControl = L.control({ position: "topleft" });
  locateControl.onAdd = function () {
    const container = L.DomUtil.create("div", "leaflet-bar");
    const btn = L.DomUtil.create("a", "", container);
    btn.href = "#";
    btn.title = "Где я на карте";
    btn.setAttribute("aria-label", "Показать моё местоположение на карте");
    btn.innerHTML = "⌖";
    btn.style.width = "28px";
    btn.style.height = "28px";
    btn.style.lineHeight = "28px";
    btn.style.textAlign = "center";
    btn.style.fontSize = "18px";
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(btn, "click", (e) => { L.DomEvent.preventDefault(e); locateMe(); });
    return container;
  };
  locateControl.addTo(map);
}

function renderMarkers() {
  markerLayer.clearLayers();
  const filtered = bins.filter(b => !currentFilterType || b.types.includes(currentFilterType));
  const markers = [];
  filtered.forEach(b => {
    const m = L.marker([b.lat, b.lon]);
    m.on("click", () => {
      showInfo(b);
      if (destMarker) { map.removeLayer(destMarker); destMarker = null; }
      destMarker = L.marker([b.lat, b.lon]).addTo(map).bindPopup("Пункт назначения");
    });
    m.bindPopup(`<strong>${b.name}</strong><br/>${b.types.join(", ")}`);
    m.bindTooltip(b.name, { direction: "top", offset: [0, -6] });
    m.addTo(markerLayer);
    markers.push(m);
  });
  if (markers.length) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
}

function focusBin(bin) {
  map.flyTo([bin.lat, bin.lon], Math.max(map.getZoom(), 14), { duration: 0.5 });
  showInfo(bin);
  if (destMarker) map.removeLayer(destMarker);
  destMarker = L.marker([bin.lat, bin.lon]).addTo(map).bindPopup("Пункт назначения");
}

async function showInfo(bin) {
  selectedBin = bin;
  document.getElementById("infoName").textContent = bin.name;
  document.getElementById("infoTypes").textContent = bin.types.join(", ");
  
  const schedules = await fetchSchedule();
  const districtSchedule = schedules.find(s => s.district.toLowerCase() === 'есиль'); // Пример, адаптируйте под реальные данные
  document.getElementById("infoSchedule").textContent = districtSchedule 
    ? `${districtSchedule.days.join(', ')}: ${districtSchedule.waste_types.join(', ')}`
    : 'Не указано';
  
  document.getElementById("infoDescription").textContent = bin.description || "-";
  updateRatingUI(bin.id);
  updateFavoriteButton();
  renderComments(bin.id);
  const g = document.getElementById("openGoogle");
  const y = document.getElementById("openYandex");
  const dest = `${bin.lat},${bin.lon}`;
  g.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
  y.href = `https://yandex.com/maps/?rtext=~${encodeURIComponent(dest)}&rtt=auto`;
  const panel = document.getElementById("infoPanel");
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
}

function closeInfo() {
  selectedBin = null;
  const panel = document.getElementById("infoPanel");
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  if (destMarker) { map.removeLayer(destMarker); destMarker = null; }
}

// ---- Route ----
function clearRoute() {
  if (currentRoute) { map.removeLayer(currentRoute); currentRoute = null; }
  if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
  if (destMarker) { map.removeLayer(destMarker); destMarker = null; }
}
function locateMe() {
  if (!navigator.geolocation) { alert("Геолокация не поддерживается вашим браузером"); return; }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const latlng = [latitude, longitude];
      if (userMarker) userMarker.setLatLng(latlng).bindPopup("Вы здесь").openPopup();
      else userMarker = L.marker(latlng).addTo(map).bindPopup("Вы здесь").openPopup();
      const targetZoom = Math.max(map.getZoom() || 0, 15);
      map.flyTo(latlng, targetZoom, { duration: 0.6 });
    },
    () => alert("Не удалось получить геолокацию"),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
  );
}
function buildRoute(destLat, destLon) {
  if (!navigator.geolocation) { alert("Геолокация не поддерживается вашим браузером"); return; }
  navigator.geolocation.getCurrentPosition(position => {
    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;
    clearRoute();
    fetch(`https://router.project-osrm.org/route/v1/driving/${userLon},${userLat};${destLon},${destLat}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.code !== "Ok") { alert("Ошибка построения маршрута"); return; }
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        currentRoute = L.polyline(coords, { color: "#0ea5e9", weight: 5 }).addTo(map);
        map.fitBounds(currentRoute.getBounds(), { padding: [40, 40] });
        userMarker = L.marker([userLat, userLon]).addTo(map).bindPopup("Вы здесь");
        destMarker = L.marker([destLat, destLon]).addTo(map).bindPopup("Пункт назначения");
      })
      .catch(() => alert("Не удалось получить маршрут"));
  }, () => alert("Не удалось получить геолокацию"));
}

// ---- Search ----
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchButton");
const searchResults = document.getElementById("searchResults");
let searchDebounce;
function openSearch() { searchResults.classList.add("open"); }
function closeSearch() { searchResults.classList.remove("open"); }
function renderLocalSuggestions(query) {
  const q = query.trim().toLowerCase();
  searchResults.innerHTML = "";
  if (!q) { closeSearch(); return; }
  const matches = bins
    .map(b => ({ bin: b, score: (b.name.toLowerCase().includes(q) ? 2 : 0) + (b.types.some(t => t.includes(q)) ? 1 : 0) }))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, 5);

  matches.forEach(({ bin }) => {
    const div = document.createElement("div");
    div.className = "search-item";
    div.innerHTML = `<div>${bin.name}</div><div class="hint">${bin.types.join(", ")}</div>`;
    div.addEventListener("click", () => {
      closeSearch();
      focusBin(bin);
    });
    searchResults.appendChild(div);
  });

  if (!matches.length) {
    const div = document.createElement("div");
    div.className = "search-item";
    div.innerHTML = `<div>Нажмите «${t("search")}» для поиска адреса</div>`;
    searchResults.appendChild(div);
  }
  openSearch();
}
function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`;
  return fetch(url, { headers: { "Accept-Language": currentLang } })
    .then(r => r.json());
}
function useGeocodeResult(results) {
  searchResults.innerHTML = "";
  if (!results.length) {
    const div = document.createElement("div");
    div.className = "search-item";
    div.textContent = "Ничего не найдено";
    searchResults.appendChild(div);
    openSearch();
    return;
  }
  results.forEach(r => {
    const name = r.display_name;
    const lat = parseFloat(r.lat), lon = parseFloat(r.lon);
    const div = document.createElement("div");
    div.className = "search-item";
    div.innerHTML = `<div>${name}</div><div class="hint">lat: ${lat.toFixed(5)}, lon: ${lon.toFixed(5)}</div>`;
    div.addEventListener("click", () => {
      closeSearch();
      if (searchMarker) map.removeLayer(searchMarker);
      searchMarker = L.marker([lat, lon]).addTo(map).bindPopup(name).openPopup();
      map.flyTo([lat, lon], 16, { duration: 0.6 });
    });
    searchResults.appendChild(div);
  });
  openSearch();
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => renderLocalSuggestions(searchInput.value), 150);
});
searchBtn.addEventListener("click", () => {
  const q = searchInput.value.trim();
  if (!q) return;
  geocode(q).then(useGeocodeResult).catch(() => {});
});
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const q = searchInput.value.trim();
    if (!q) return;
    geocode(q).then(useGeocodeResult).catch(() => {});
  } else if (e.key === "Escape") {
    closeSearch();
  }
});
document.addEventListener("click", (e) => {
  if (!searchResults.contains(e.target) && e.target !== searchInput && e.target !== searchBtn) closeSearch();
});

// ---- Events ----
document.getElementById("typeFilter").addEventListener("change", e => {
  currentFilterType = e.target.value;
  renderMarkers();
  closeInfo();
  clearRoute();
});
document.getElementById("closeInfoButton").addEventListener("click", closeInfo);
document.getElementById("hideInfoButton").addEventListener("click", closeInfo);

document.getElementById("ratingStars").addEventListener("click", e => {
  if (e.target.tagName !== "BUTTON") return;
  if (!selectedBin) return alert("Сначала выберите пункт на карте");
  const rating = Number(e.target.dataset.value);
  if (rating < 1 || rating > 5) return;
  addRating(selectedBin.id, rating);
  updateRatingUI(selectedBin.id);
  alert(`Вы поставили оценку ${rating} звёзд пункту "${selectedBin.name}"`);
});

document.getElementById("routeButton").addEventListener("click", () => {
  if (!selectedBin) return alert("Выберите пункт для построения маршрута");
  buildRoute(selectedBin.lat, selectedBin.lon);
});
document.getElementById("clearRouteButton").addEventListener("click", clearRoute);

document.getElementById("favoriteButton").addEventListener("click", () => {
  if (!selectedBin) return;
  toggleFavorite(selectedBin.id);
});
const favBtn = document.getElementById("favoritesBtn");
const favDD = document.getElementById("favoritesDropdown");
favBtn.addEventListener("click", () => {
  if (favDD.classList.contains("open")) favDD.classList.remove("open");
  else { renderFavoritesDropdown(); favDD.classList.add("open"); }
});
document.addEventListener("click", (e) => {
  if (!favDD.contains(e.target) && e.target !== favBtn) favDD.classList.remove("open");
});

document.getElementById("submitComment").addEventListener("click", () => {
  if (!selectedBin) return alert("Сначала выберите пункт");
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text) return;
  addComment(selectedBin.id, text);
  input.value = "";
  renderComments(selectedBin.id);
});

const langSelect = document.getElementById("langSelect");
langSelect.value = currentLang;
langSelect.addEventListener("change", () => {
  currentLang = langSelect.value;
  localStorage.setItem("lang", currentLang);
  renderTexts();
});

const themeToggle = document.getElementById("themeToggle");
const storedTheme = localStorage.getItem("theme") || "light";
if (storedTheme === "dark") document.documentElement.classList.add("dark");
themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
});

const photoButton = document.getElementById("photoButton");
const photoInput = document.getElementById("photoInput");
photoButton.addEventListener("click", () => photoInput.click());

photoInput.addEventListener("change", async () => {
    const file = photoInput.files[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
        alert("Поддерживаются только JPG и PNG.");
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        alert("Файл слишком большой. Максимальный размер: 5MB.");
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('http://localhost:8080/classify', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Server response:', result);

        if (result.status === 'error') {
            console.error('Server error:', result.error);
            if (result.error.includes('instance_quota_exceeded')) {
                alert('Ошибка: Превышен лимит вычислительных ресурсов IBM Watson. Попробуйте позже или обновите тарифный план.');
            } else {
                alert('Ошибка: ' + result.error);
            }
        } else {
            if (result.data && result.data.category) {
                const { category, confidence } = result.data;
                alert(`Тип мусора: ${category}\nУверенность: ${(confidence * 100).toFixed(2)}%`);
            }
            if (result.data && Array.isArray(result.data.probabilities)) {
                let message = 'Распределение вероятностей:\n';
                result.data.probabilities.forEach(item => {
                    message += `${item.class_name}: ${(item.confidence * 100).toFixed(2)}%\n`;
                });
                alert(message);
            }
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Ошибка сети: ' + error.message);
    }

    photoInput.value = "";
});


// Init
window.addEventListener("load", () => {
  renderTexts();
  initMap();
  renderFavoritesDropdown();
});