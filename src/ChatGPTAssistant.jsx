import React, { useState } from 'react';
import axios from 'axios';

const ChatGPTAssistant = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!input.trim()) {
      setResponse("Please enter a weather alert.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await axios.post('http://localhost:3000/chatgpt', { prompt: input });
      setResponse(result.data.message);
    } catch (error) {
      console.error("Error fetching response:", error);
      setResponse("Sorry, something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatgpt-assistant">
      <h2>Weather Alert Assistant</h2>
      <p>Enter a weather alert (e.g., "tornado," "heavy rain," "snowstorm") to get safety tips and an analysis of the current weather conditions for the next 3 hours.</p>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter weather alert..."
      />
      <button onClick={handleAsk} disabled={isLoading}>
        {isLoading ? 'Getting Safety Tips...' : 'Get Safety Tips'}
      </button>
      <p dangerouslySetInnerHTML={{ __html: response }}></p>
    </div>
  );
};

export default ChatGPTAssistant;
