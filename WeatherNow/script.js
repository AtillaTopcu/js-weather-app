const API_KEY = 'e3df58bbf758c7ffe5d20f5d3e051b9d';

const form = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const errorMessage = document.getElementById('error-message');

const weatherInfo = document.querySelector('.weather-info');

const tempValue = document.getElementById('temp-value');
const feelsLikeValue = document.getElementById('feels-like-value');
const humidityValue = document.getElementById('humidity-value');
const conditionValue = document.getElementById('condition-value');

if (weatherInfo) {
  weatherInfo.style.display = 'none';
}

async function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric&lang=en`;

  try {
    errorMessage.style.display = 'none';

    const res = await fetch(url);
    if (!res.ok) {
      console.log('HTTP status:', res.status);
      throw new Error(res.status === 404 ? 'City not found.' : 'Something went wrong.');
    }

    const data = await res.json();
    updateUI(data);
  } catch (err) {
    showError(err.message);
  }
}

function updateUI(data) {
  const temp = Math.round(data.main.temp);
  const feels = Math.round(data.main.feels_like);
  const humidity = data.main.humidity;
  const condition = data.weather[0].description;

  tempValue.textContent = `${temp}°C`;
  feelsLikeValue.textContent = `${feels}°C`;
  humidityValue.textContent = `%${humidity}`;
  conditionValue.textContent = condition;

  if (weatherInfo) {
    weatherInfo.style.display = 'flex';
  }
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = 'block';

  tempValue.textContent = '';
  feelsLikeValue.textContent = '';
  humidityValue.textContent = '';
  conditionValue.textContent = '';

  if (weatherInfo) {
    weatherInfo.style.display = 'none';
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  fetchWeather(city);
});
