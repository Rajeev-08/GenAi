require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname)); // Serve all files from the current directory

// Serve the static HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "Your name is nemo, You are a chatbot designed to provide mental health and emotional support to students.",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

let chatHistory = [];

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  chatHistory.push({ role: 'user', text: userMessage });
  
  const formattedHistory = chatHistory.map(message => ({
    role: message.role,
    parts: [{ text: message.text }]
  }));

  const chatSession = model.startChat({ generationConfig, history: formattedHistory });

  try {
    const result = await chatSession.sendMessage(userMessage);
    const botResponse = result.response.text();

    chatHistory.push({ role: 'model', text: botResponse });

    res.json({ botResponse });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
