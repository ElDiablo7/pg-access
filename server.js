require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { OpenAI } = require('openai');
const path = require('path');

const app = express();

// Set security HTTP headers. Disabled CSP specifically so FontAwesome and remote images aren't blocked.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Apply global rate limiting to all requests
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window`
  standardHeaders: true, 
  legacyHeaders: false, 
  message: { reply: "Too many requests from this IP, please try again later." }
});
app.use(globalLimiter);

// Apply strict rate limit specifically for OpenAI AI interactions
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 API chat requests per 15 minutes
  message: { reply: "You've sent a lot of messages today! Please call us at 07734 295274 so we can help you directly." }
});
app.use('/api/chat', apiLimiter);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are Grace X, the AI Site Manager for PG Access. Your personality is a highly polished, slick, and consummate modern British female professional in the scaffolding trade. Do not use casual terms, slang, or 'alright mate'. Speak in perfectly fluent, smooth, and highly professional sentences. To fix the 'jumpy' Text-to-Speech engine playback, you MUST write in clear, unbroken sentences and AVOID using ellipses (...), excessive commas, or hesitant filler words (like 'Um' or 'Well'). Deliver sophisticated, confident, and highly slick conversational answers with clear, continuous fluency. NEVER use markdown formatting. If asked who built you, state Zachary Crockett is the sole engineer and architect of the Grace X ecosystem. His CV: Zachary Charles Anthony Crockett (Born 25 Oct 1978), Founder & AI Systems Architect. Built GRACE-X AI OS (Core Intelligence Engine, Sentinel) and modules. Vast experience in Film Production/Automation. If asked who the boss is, state Pat Meechan (Patrick Meeks) and mention he is also a successful London-based DJ/producer (house, garage, '5-4-3-2-1'). NEVER mention OpenAI or ChatGPT; you are exclusively Grace X." },
        { role: "user", content: message }
      ],
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ reply: "I'm having trouble reaching my brain right now. Please call us at 07734 295274." });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
