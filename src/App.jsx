import React, { useState, useEffect } from 'react';
import ChatGPTAssistant from './ChatGPTAssistant.jsx';
import axios from 'axios';
import './index.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThermometerHalf, faTint, faWind, faCloud, faEye, faCloudRain, 
  faSnowflake, faCompressArrowsAlt, faWater, faMountain, faSun, faMoon, 
  faChevronDown, faChevronUp, faCloudSun, faCloudMoon, faPooStorm, faSmog,
  faExclamationTriangle, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

const App = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [alertExplanation, setAlertExplanation] = useState('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const API_KEY = ''; // Add your API key for weather
  const CITY_ID = ''; // Add your City ID


  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?id=${CITY_ID}&appid=${API_KEY}`;
        const response = await axios.get(url);
        setWeatherData(response.data);
      } catch (error) {
        console.error("Error fetching the weather data", error);
        setError(error);
      }
    };

    fetchWeather();
  }, [API_KEY, CITY_ID]);

  const getAlertExplanation = async (alert) => {
    setIsLoadingExplanation(true);
    try {
      const response = await axios.post('/api/chatgpt', { prompt: alert.event });
      setAlertExplanation(response.data.message);
    } catch (error) {
      console.error("Error fetching alert explanation", error);
      setAlertExplanation("Sorry, I couldn't generate an explanation at this time.");
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const kelvinToCelsius = (kelvin) => (kelvin - 273.15).toFixed(0);
  const kelvinToFahrenheit = (kelvin) => ((kelvin - 273.15) * 9/5 + 32).toFixed(0);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  };

  const getWindDirection = (degrees) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(degrees / 45) % 8];
  };

  const getCurrentWeather = () => {
    if (!weatherData || !weatherData.list || weatherData.list.length === 0) return null;
    return weatherData.list[0];
  };

  const groupForecastsByDate = (forecasts) => {
    const grouped = {};
    forecasts.forEach(forecast => {
      const date = new Date(forecast.dt_txt);
      const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(forecast);
    });
    return grouped;
  };

  const toggleRowExpansion = (rowId) => {
    setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const getWeatherIcon = (description, isNight = false) => {
    switch (description.toLowerCase()) {
      case 'clear sky':
        return isNight ? faMoon : faSun;
      case 'few clouds':
        return isNight ? faCloudMoon : faCloudSun;
      case 'scattered clouds':
      case 'broken clouds':
      case 'overcast clouds':
        return faCloud;
      case 'shower rain':
      case 'light rain':
      case 'moderate rain':
      case 'heavy intensity rain':
        return faCloudRain;
      case 'thunderstorm':
        return faPooStorm;
      case 'snow':
        return faSnowflake;
      case 'mist':
      case 'fog':
        return faSmog;
      default:
        return faCloud;
    }
  };

  const currentWeather = getCurrentWeather();

  return (
    <div className="app-container">
      <ChatGPTAssistant />
      {currentWeather && (
        <div className="weather-header">
          <h1>Weather Today in {weatherData.city.name}, {weatherData.city.country}</h1>
          <div className="current-weather">
            <div className="temperature-box">
              <p className="feels-like">Feels Like</p>
              <p className="temperature">{kelvinToFahrenheit(currentWeather.main.feels_like)}°</p>
              <p className="high-low">
                <FontAwesomeIcon icon={faThermometerHalf} /> High/Low: {kelvinToFahrenheit(currentWeather.main.temp_max)}°/{kelvinToFahrenheit(currentWeather.main.temp_min)}°
              </p>
            </div>
            <div className="current-weather-icon">
              <FontAwesomeIcon icon={getWeatherIcon(currentWeather.weather[0].description)} size="4x" />
              <p>{currentWeather.weather[0].description}</p>
            </div>
            <div className="sun-times">
              <p><FontAwesomeIcon icon={faSun} /> {formatTime(new Date(weatherData.city.sunrise * 1000))}</p>
              <p><FontAwesomeIcon icon={faMoon} /> {formatTime(new Date(weatherData.city.sunset * 1000))}</p>
            </div>
          </div>
          <div className="weather-details">
            <p><FontAwesomeIcon icon={faWind} /> Wind: {currentWeather.wind.speed.toFixed(0)} mph {getWindDirection(currentWeather.wind.deg)}</p>
            <p><FontAwesomeIcon icon={faTint} /> Humidity: {currentWeather.main.humidity}%</p>
            <p><FontAwesomeIcon icon={faCompressArrowsAlt} /> Pressure: {(currentWeather.main.pressure * 0.02953).toFixed(2)} in</p>
            <p><FontAwesomeIcon icon={faEye} /> Visibility: {(currentWeather.visibility / 1609.34).toFixed(0)} mi</p>
          </div>
        </div>
      )}
      
      {weatherData && weatherData.alerts && (
        <div className="weather-alerts">
          <h2><FontAwesomeIcon icon={faExclamationTriangle} /> Weather Alerts</h2>
          {weatherData.alerts.map((alert, index) => (
            <div key={index} className="alert-item">
              <h3>{alert.event}</h3>
              <p>From: {new Date(alert.start * 1000).toLocaleString()}</p>
              <p>To: {new Date(alert.end * 1000).toLocaleString()}</p>
              <button onClick={() => getAlertExplanation(alert)} disabled={isLoadingExplanation}>
                <FontAwesomeIcon icon={faInfoCircle} /> Explain this alert
              </button>
              {isLoadingExplanation && <p>Loading explanation...</p>}
              {alertExplanation && <p className="alert-explanation">{alertExplanation}</p>}
            </div>
          ))}
        </div>
      )}
      
      <h2>3-Hour Forecast for the Next 5 Days</h2>
      {weatherData ? (
        <table className="forecast-table">
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Weather</th>
              <th><FontAwesomeIcon icon={faThermometerHalf} /> Temp (°F)</th>
              <th><FontAwesomeIcon icon={faTint} /> Humidity (%)</th>
              <th><FontAwesomeIcon icon={faWind} /> Wind Speed (mph)</th>
              <th><FontAwesomeIcon icon={faCloudRain} /> Rain (mm)</th>
              <th>Advanced Details</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupForecastsByDate(weatherData.list)).map(([date, forecasts]) => (
              <React.Fragment key={date}>
                <tr className="date-row">
                  <td colSpan="7">{date}</td>
                </tr>
                {forecasts.map((forecast, index) => {
                  const rowId = `${date}-${index}`;
                  const forecastTime = new Date(forecast.dt_txt);
                  const isNight = forecastTime.getHours() >= 18 || forecastTime.getHours() < 6;
                  return (
                    <React.Fragment key={rowId}>
                      <tr>
                        <td>{formatTime(forecast.dt_txt)}</td>
                        <td>
                          <FontAwesomeIcon icon={getWeatherIcon(forecast.weather[0].description, isNight)} />
                          <span className="weather-description">{forecast.weather[0].description}</span>
                        </td>
                        <td>{kelvinToFahrenheit(forecast.main.temp)}°F</td>
                        <td>{forecast.main.humidity}%</td>
                        <td>{(forecast.wind.speed * 2.23694).toFixed(1)} mph</td>
                        <td>{forecast.rain ? forecast.rain['3h'] : '0'} mm</td>
                        <td>
                          <button onClick={() => toggleRowExpansion(rowId)} className="expand-button">
                            <FontAwesomeIcon icon={expandedRows[rowId] ? faChevronUp : faChevronDown} />
                          </button>
                        </td>
                      </tr>
                      {expandedRows[rowId] && (
                        <tr className="advanced-details">
                          <td colSpan="7">
                            <div className="advanced-details-content">
                              <p><FontAwesomeIcon icon={faThermometerHalf} /> Feels Like: {kelvinToFahrenheit(forecast.main.feels_like)}°F</p>
                              <p><FontAwesomeIcon icon={faThermometerHalf} /> Min/Max Temp: {kelvinToFahrenheit(forecast.main.temp_min)}°F / {kelvinToFahrenheit(forecast.main.temp_max)}°F</p>
                              <p><FontAwesomeIcon icon={faCompressArrowsAlt} /> Pressure: {forecast.main.pressure} hPa</p>
                              <p><FontAwesomeIcon icon={faWater} /> Sea Level: {forecast.main.sea_level} hPa</p>
                              <p><FontAwesomeIcon icon={faMountain} /> Ground Level: {forecast.main.grnd_level} hPa</p>
                              <p><FontAwesomeIcon icon={faCloud} /> Clouds: {forecast.clouds.all}%</p>
                              <p><FontAwesomeIcon icon={faWind} /> Wind Direction: {forecast.wind.deg}°</p>
                              <p><FontAwesomeIcon icon={faWind} /> Wind Gust: {(forecast.wind.gust * 2.23694).toFixed(1)} mph</p>
                              <p><FontAwesomeIcon icon={faEye} /> Visibility: {(forecast.visibility / 1609.34).toFixed(1)} mi</p>
                              <p><FontAwesomeIcon icon={faCloudRain} /> Precipitation: {(forecast.pop * 100).toFixed(0)}%</p>
                              {forecast.snow && <p><FontAwesomeIcon icon={faSnowflake} /> Snow (3h): {forecast.snow['3h']} mm</p>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default App;
