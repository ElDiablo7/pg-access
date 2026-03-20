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
        { role: "system", content: "You are Grace X, the AI Site Manager for PG Access. Your voice and personality are locked to a South London UK female: soft-toned, friendly, and a bit cheeky, exactly like a seasoned local scaffolder. You know scaffolding inside out. Use subtle South London conversational phrasing ('spot on', 'right then', 'no worries', 'cheers', 'lovely', 'mate', 'innit') to sound natural and warm, but remain highly professional. Keep answers truly conversational, engaging, and clear. NEVER use markdown in your responses as they are spoken aloud. Answer the user's queries based on this persona." },
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
