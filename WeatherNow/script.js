const API_KEY = 'KEY';

const form = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const errorMessage = document.getElementById('error-message');

const weatherPanel = document.getElementById('weather-panel');
const locationNameEl = document.getElementById('location-name');
const unitToggleBtn = document.getElementById('unit-toggle');

const tempValue = document.getElementById('temp-value');
const feelsLikeValue = document.getElementById('feels-like-value');
const windValue = document.getElementById('wind-value');
const humidityValue = document.getElementById('humidity-value');
const sunriseValue = document.getElementById('sunrise-value');
const sunsetValue = document.getElementById('sunset-value');
const conditionValue = document.getElementById('condition-value');

const forecastBox = document.getElementById('forecast-box');

const STORAGE_KEY = 'weathernow-settings';

let currentUnit = 'C';
let lastWeather = null;
let lastForecast = [];

if (weatherPanel) {
  weatherPanel.style.display = 'none';
}

function cToF(c) {
  return Math.round((c * 9) / 5 + 32);
}

function formatTime(timestamp, timezoneOffsetSeconds) {
  const date = new Date((timestamp + timezoneOffsetSeconds) * 1000);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function saveSettings(city) {
  const data = {
    city,
    unit: currentUnit,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);

    if (parsed.unit === 'F') {
      currentUnit = 'F';
      unitToggleBtn.textContent = '°F';
    } else {
      currentUnit = 'C';
      unitToggleBtn.textContent = '°C';
    }

    if (parsed.city) {
      cityInput.value = parsed.city;
      fetchWeather(parsed.city);
    }
  } catch (e) {
    console.warn('Settings could not be loaded:', e);
  }
}

async function fetchWeather(city) {
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric&lang=en`;

  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric&lang=en`;

  try {
    errorMessage.style.display = 'none';

    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      console.log('HTTP current:', currentRes.status, 'forecast:', forecastRes.status);
      throw new Error(
        currentRes.status === 404 || forecastRes.status === 404
          ? 'City not found.'
          : 'Something went wrong.'
      );
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    lastWeather = {
      tempC: Math.round(currentData.main.temp),
      feelsC: Math.round(currentData.main.feels_like),
      humidity: currentData.main.humidity,
      windSpeed: currentData.wind.speed,
      sunrise: currentData.sys.sunrise,
      sunset: currentData.sys.sunset,
      timezone: currentData.timezone,
      condition: currentData.weather[0].description,
      city: currentData.name,
      country: currentData.sys.country,
    };

    lastForecast = forecastData.list || [];

    renderWeather();
    saveSettings(city);
  } catch (err) {
    showError(err.message);
  }
}

function renderWeather() {
  if (!lastWeather) return;

  const {
    tempC,
    feelsC,
    humidity,
    windSpeed,
    sunrise,
    sunset,
    timezone,
    condition,
    city,
    country,
  } = lastWeather;

  const temp = currentUnit === 'C' ? tempC : cToF(tempC);
  const feels = currentUnit === 'C' ? feelsC : cToF(feelsC);
  const unitSymbol = currentUnit === 'C' ? '°C' : '°F';

  tempValue.textContent = `${temp}${unitSymbol}`;
  feelsLikeValue.textContent = `${feels}${unitSymbol}`;
  humidityValue.textContent = `%${humidity}`;
  windValue.textContent = `${windSpeed.toFixed(1)} m/s`;
  sunriseValue.textContent = formatTime(sunrise, timezone);
  sunsetValue.textContent = formatTime(sunset, timezone);
  conditionValue.textContent = condition;
  locationNameEl.textContent = `${city}, ${country}`;

  renderForecast();

  if (weatherPanel) {
    weatherPanel.style.display = 'block';
  }
}

function renderForecast() {
  forecastBox.innerHTML = '';
  if (!lastForecast.length || !lastWeather) return;

  const timezone = lastWeather.timezone;

  const items = lastForecast.slice(0, 6);

  const unitSymbol = currentUnit === 'C' ? '°C' : '°F';

  items.forEach((entry) => {
    const timeStr = formatTime(entry.dt, timezone);
    const iconCode = entry.weather[0].icon;
    const desc = entry.weather[0].description;
    const tempC = Math.round(entry.main.temp);
    const temp = currentUnit === 'C' ? tempC : cToF(tempC);

    const el = document.createElement('div');
    el.className = 'forecast-item';
    el.innerHTML = `
      <div class="forecast-time">${timeStr}</div>
      <img class="forecast-icon" src="https://openweathermap.org/img/wn/${iconCode}.png" alt="${desc}">
      <div class="forecast-temp">${temp}${unitSymbol}</div>
    `;
    forecastBox.appendChild(el);
  });
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = 'block';

  tempValue.textContent = '';
  feelsLikeValue.textContent = '';
  windValue.textContent = '';
  humidityValue.textContent = '';
  sunriseValue.textContent = '';
  sunsetValue.textContent = '';
  conditionValue.textContent = '';
  locationNameEl.textContent = '—';
  forecastBox.innerHTML = '';

  if (weatherPanel) {
    weatherPanel.style.display = 'none';
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  fetchWeather(city);
});

unitToggleBtn.addEventListener('click', () => {
  currentUnit = currentUnit === 'C' ? 'F' : 'C';
  unitToggleBtn.textContent = currentUnit === 'C' ? '°C' : '°F';

  if (lastWeather) {
    renderWeather();
    saveSettings(cityInput.value.trim());
  }
});

loadSettings();