// Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherDisplay = document.getElementById('weather-display');
const initialState = document.getElementById('initial-state');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');

// UI Elements to update
const cityNameEl = document.getElementById('city-name');
const dateTimeEl = document.getElementById('date-time');
const weatherIconEl = document.getElementById('weather-icon');
const tempValueEl = document.getElementById('temp-value');
const weatherDescEl = document.getElementById('weather-desc');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const visibilityEl = document.getElementById('visibility');
const pressureEl = document.getElementById('pressure');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// WMO Weather Code Map (Open-Meteo)
function getWeatherDescription(code) {
    const codes = {
        0: { desc: "Clear sky", icon: "fa-sun" },
        1: { desc: "Mainly clear", icon: "fa-cloud-sun" },
        2: { desc: "Partly cloudy", icon: "fa-cloud-sun" },
        3: { desc: "Overcast", icon: "fa-cloud" },
        45: { desc: "Fog", icon: "fa-smog" },
        48: { desc: "Depositing rime fog", icon: "fa-smog" },
        51: { desc: "Light drizzle", icon: "fa-cloud-rain" },
        53: { desc: "Moderate drizzle", icon: "fa-cloud-rain" },
        55: { desc: "Dense drizzle", icon: "fa-cloud-rain" },
        61: { desc: "Slight rain", icon: "fa-cloud-showers-heavy" },
        63: { desc: "Moderate rain", icon: "fa-cloud-showers-heavy" },
        65: { desc: "Heavy rain", icon: "fa-cloud-showers-heavy" },
        71: { desc: "Slight snow", icon: "fa-snowflake" },
        73: { desc: "Moderate snow", icon: "fa-snowflake" },
        75: { desc: "Heavy snow", icon: "fa-snowflake" },
        77: { desc: "Snow grains", icon: "fa-snowflake" },
        80: { desc: "Slight rain showers", icon: "fa-cloud-showers-heavy" },
        81: { desc: "Moderate rain showers", icon: "fa-cloud-showers-heavy" },
        82: { desc: "Violent rain showers", icon: "fa-cloud-showers-heavy" },
        85: { desc: "Slight snow showers", icon: "fa-snowflake" },
        86: { desc: "Heavy snow showers", icon: "fa-snowflake" },
        95: { desc: "Thunderstorm", icon: "fa-bolt" },
        96: { desc: "Thunderstorm with hail", icon: "fa-bolt" },
        99: { desc: "Thunderstorm with heavy hail", icon: "fa-bolt" }
    };
    return codes[code] || { desc: "Unknown", icon: "fa-question-circle" };
}

async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) return;

    // Reset UI
    showLoading();
    errorMessage.classList.add('hidden');
    errorMessage.textContent = '';

    try {
        // Step 1: Geocoding (City -> Lat/Lon)
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(`City '${city}' not found.`);
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // Step 2: Weather Data
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m,visibility&wind_speed_unit=kmh`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        updateUI(name, country, weatherData.current);
    } catch (error) {
        showError(error.message);
    }
}

function updateUI(city, country, data) {
    // Hide spinner, show content
    loadingSpinner.classList.add('hidden');
    initialState.classList.add('hidden');
    weatherDisplay.classList.remove('hidden');

    // Update City & Time
    cityNameEl.textContent = `${city}, ${country}`;
    const now = new Date();
    dateTimeEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Update Weather Info
    tempValueEl.textContent = Math.round(data.temperature_2m);
    
    // Weather Condition & Icon
    const weatherInfo = getWeatherDescription(data.weather_code);
    weatherDescEl.textContent = weatherInfo.desc;
    
    // Reset icon classes and add new ones
    weatherIconEl.className = 'fa-solid';
    weatherIconEl.classList.add(weatherInfo.icon);

    // Details
    humidityEl.textContent = `${data.relative_humidity_2m}%`;
    windSpeedEl.textContent = `${data.wind_speed_10m} km/h`;
    
    // Visibility might be in meters, convert to km if large, otherwise keep
    // OpenAI API usually gives meters, Open-Meteo gives meters as well usually
    // Let's check the API response unit. If > 1000, convert to km.
    const visKm = data.visibility / 1000;
    visibilityEl.textContent = `${visKm.toFixed(1)} km`;
    
    pressureEl.textContent = `${data.surface_pressure} hPa`;
}

function showLoading() {
    initialState.classList.add('hidden');
    weatherDisplay.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
}

function showError(message) {
    loadingSpinner.classList.add('hidden');
    // If we were showing weather, keep showing it but show error? 
    // Usually better to go back to initial or show error state.
    // Let's show empty state with error in header
    if (!weatherDisplay.classList.contains('hidden')) {
        // If weather is already showing, just toast the error (optional), but here we just clear the input error
        // Revert to hidden?? No, keep previous weather if logic allows, but for simplicity:
    } else {
        initialState.classList.remove('hidden');
    }
    
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}
