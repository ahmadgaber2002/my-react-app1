const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/api/chatgpt', async (req, res) => {
  const { prompt } = req.body;
  
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful weather expert. Explain weather alerts in simple terms and provide safety tips." },
        { role: "user", content: `Explain this weather alert and provide safety tips: ${prompt}` }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ message: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));