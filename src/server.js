import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';
import OpenAI from 'openai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const CITY_ID = '5318313';

// Serve static files from the React app
app.use(express.static(join(__dirname, 'dist')));

app.post('/chatgpt', async (req, res) => {
  const { prompt } = req.body;

  const isWeatherRelated = (query) => {
    const weatherKeywords = ['rain', 'snow', 'wind', 'storm', 'tornado', 'hail', 
      'hurricane', 'fog', 'flood', 'clouds', 'temperature', 'precipitation', 'humidity', 'visibility', 'sunny'];
    return weatherKeywords.some(keyword => query.toLowerCase().includes(keyword));
  };

  if (!prompt) {
    res.status(400).json({ message: "Invalid request. Please provide a prompt." });
    return;
  }

  if (!isWeatherRelated(prompt)) {
    res.json({ message: "Unfortunately, I can't help with this." });
    return;
  }

  try {
    const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?id=${CITY_ID}&appid=${WEATHER_API_KEY}&units=metric`);
    const weatherData = weatherResponse.data;

    const nextThreeHours = weatherData.list.slice(0, 1);
    const weatherSummary = nextThreeHours.map(forecast => {
      return `At ${forecast.dt_txt}, the weather will be ${forecast.weather[0].description} with a temperature of ${forecast.main.temp}°C, wind speed of ${forecast.wind.speed} m/s, and precipitation of ${forecast.pop * 100}% chance.`;
    }).join(' ');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful weather expert. Given the current weather conditions and forecast, determine if the specified weather alert is likely and provide safety tips. I need the first sentence to give the final answer and then leave a blank line after."
        },
        {
          role: "user",
          content: `Here is the current weather data: ${weatherSummary}. Based on this, analyze if this weather alert is possible in the next 3 hours: ${prompt}. Provide safety tips and precautions in case the specified weather alert is likely to happen.`
        }
      ],
      temperature: 0,
    });
    
    // After getting the completion message from the OpenAI API
    let message = completion.choices[0].message.content;
    
    // Apply bold to the first sentence and add a blank line after
    const firstSentenceEnd = message.indexOf('.') + 1; // Identifies the end of the first sentence
    if (firstSentenceEnd > 0) {
        // Insert a double line break after the first sentence
        message = `<strong>${message.slice(0, firstSentenceEnd).trim()}</strong>\n\n${message.slice(firstSentenceEnd).trim()}`;
    }
    
    // Bold "Safety tips and precautions:"
    message = message.replace(/Safety tips and precautions:/g, '<strong>Safety tips and precautions:</strong>');
    
    // Replace Markdown bold (**) with HTML bold tags (<strong>)
    message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Send the formatted message back to the client
    res.json({ message });
    
  
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
