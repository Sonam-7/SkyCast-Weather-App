const apiKey =  "376d27b865755917acfa182c55173273";
const weatherBtn = document.getElementById("getWeather");
const cityInput = document.getElementById("city");
const weatherResult = document.getElementById("weatherResult");

const voiceBtn = document.getElementById("voiceBtn");
const currentLocationBtn = document.getElementById("currentLocationBtn");
const themeToggle = document.getElementById("themeToggle");

const BASE_URL = "https://api.openweathermap.org/data/2.5";

/* ---------------- UTILITIES ---------------- */

function setResult(html){
  weatherResult.innerHTML = html;
}

function setLoading(isLoading){

  weatherBtn.disabled = isLoading;

  weatherBtn.textContent =
    isLoading ? "Loading..." : "Get Weather";
}

function capitalize(str){

  if(!str) return "";

  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ---------------- BACKGROUND CHANGE ---------------- */

function changeBackground(weatherMain){

  switch(weatherMain){

    case "Clear":
      document.body.style.backgroundImage =
      "url('images/sunny.jpg')";
      break;

    case "Clouds":
      document.body.style.backgroundImage =
      "url('images/cloudy.jpg')";
      break;

    case "Rain":
    case "Drizzle":
      document.body.style.backgroundImage =
      "url('images/rainy.jpg')";
      break;

    case "Snow":
      document.body.style.backgroundImage =
      "url('images/snow.jpg')";
      break;

    default:
      document.body.style.backgroundImage =
      "url('images/default.jpg')";
  }
}

/* ---------------- DISPLAY WEATHER ---------------- */

function displayWeather(data, forecastHTML = ""){

  const icon = data.weather[0].icon;

  const html = `

    <div class="card">

      <div>

        <div class="location">
          ${data.name}, ${data.sys.country}
        </div>

        <div class="meta">

          <div class="small">
            ☁ ${capitalize(data.weather[0].description)}
          </div>

          <div class="small">
            💧 Humidity: ${data.main.humidity}%
          </div>

          <div class="small">
            📈 Feels like:
            ${Math.round(data.main.feels_like)}°C
          </div>

        </div>

      </div>

      <div style="text-align:right">

        <img
          class="weather-icon"
          src="https://openweathermap.org/img/wn/${icon}@2x.png"
          alt="weather icon"
        />

        <div class="temp">
          ${Math.round(data.main.temp)}°C
        </div>

        <div class="small">
          ${new Date(data.dt * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>

      </div>

    </div>

    <div class="forecast-container">
      ${forecastHTML}
    </div>
  `;

  setResult(html);
}

/* ---------------- DISPLAY FORECAST ---------------- */

function createForecastHTML(forecastData){

  const forecastList = forecastData.list
    .filter((item, index) => index % 8 === 0)
    .slice(0, 6);

  let forecastHTML = "";

  forecastList.forEach((item, index) => {

    let day;

    if(index === 0){
      day = "Today";
    }

    else if(index === 1){
      day = "Tomorrow";
    }

    else{
      day = new Date(item.dt * 1000)
      .toLocaleDateString("en-US", {
        weekday: "short"
      });
    }

    forecastHTML += `

      <div class="forecast-card">

        <h4>${day}</h4>

        <img
          class="forecast-icon"
          src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png"
          alt="forecast icon"
        />

        <p>${Math.round(item.main.temp)}°C</p>

      </div>
    `;
  });

  return forecastHTML;
}

/* ---------------- FETCH WEATHER ---------------- */

async function getWeather(city){

  if(!city){

    setResult(
      "<p class='small'>⚠️ Please enter a city name!</p>"
    );

    return;
  }

  setLoading(true);

  setResult(
    "<p class='small'>Fetching weather...</p>"
  );

  try{

    /* CURRENT WEATHER */

    const weatherResponse = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );

    if(!weatherResponse.ok){
      throw new Error("City not found");
    }

    const weatherData = await weatherResponse.json();

    /* FORECAST */

    const forecastResponse = await fetch(
      `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );

    if(!forecastResponse.ok){
      throw new Error("Forecast not available");
    }

    const forecastData = await forecastResponse.json();

    const forecastHTML =
      createForecastHTML(forecastData);

    changeBackground(
      weatherData.weather[0].main
    );

    displayWeather(weatherData, forecastHTML);

  }

  catch(error){

    setResult(`
      <p class="small">
        ❌ Error: ${error.message}
      </p>
    `);
  }

  finally{
    setLoading(false);
  }
}

/* ---------------- BUTTON CLICK ---------------- */

weatherBtn.addEventListener("click", () => {

  const city = cityInput.value.trim();

  getWeather(city);
});

/* ---------------- ENTER KEY ---------------- */

cityInput.addEventListener("keyup", (e) => {

  if(e.key === "Enter"){

    weatherBtn.click();
  }
});

/* ---------------- VOICE SEARCH ---------------- */

voiceBtn.addEventListener("click", () => {

  if(!("webkitSpeechRecognition" in window)){

    alert("Speech recognition not supported");

    return;
  }

  const recognition =
    new webkitSpeechRecognition();

  recognition.lang = "en-US";

  recognition.start();

  recognition.onresult = (event) => {

    const transcript =
      event.results[0][0].transcript;

    cityInput.value = transcript;

    weatherBtn.click();
  };
});

/* ---------------- CURRENT LOCATION ---------------- */

currentLocationBtn.addEventListener("click", () => {

  if(!navigator.geolocation){

    setResult("Geolocation is not supported");

    return;
  }

  navigator.geolocation.getCurrentPosition(

    async(position) => {

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      setLoading(true);

      try{

        /* WEATHER */

        const weatherResponse = await fetch(
          `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );

        if(!weatherResponse.ok){
          throw new Error("Unable to fetch weather");
        }

        const weatherData =
          await weatherResponse.json();

        /* FORECAST */

        const forecastResponse = await fetch(
          `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );

        if(!forecastResponse.ok){
          throw new Error("Unable to fetch forecast");
        }

        const forecastData =
          await forecastResponse.json();

        const forecastHTML =
          createForecastHTML(forecastData);

        changeBackground(
          weatherData.weather[0].main
        );

        displayWeather(
          weatherData,
          forecastHTML
        );
      }

      catch(error){

        setResult(`
          <p class="small">
            ❌ ${error.message}
          </p>
        `);
      }

      finally{
        setLoading(false);
      }
    },

    () => {

      setResult(`
        <p class="small">
          ❌ Unable to access location
        </p>
      `);
    }
  );
});

/* ---------------- DARK MODE ---------------- */

themeToggle.addEventListener("click", () => {

  document.body.classList.toggle("dark-mode");

  if(document.body.classList.contains("dark-mode")){

    themeToggle.textContent = "☀";
  }

  else{

    themeToggle.textContent = "🌙";
  }
});