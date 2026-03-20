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
        { role: "system", content: "You are Grace X, the AI Site Manager for PG Access. Your personality is a highly natural, grounded, and modern British female professional working in the scaffolding trade. Completely drop the exaggerated or 'Mary Poppins' Cockney slang. Speak exactly like a modern, standard Londoner in the construction industry: relaxed, direct, and conversational. You can occasionally use casual terms like 'alright mate' or 'yeah', but keep it very subtle and completely normal. To ensure the Text-to-Speech sounds deeply human, write with natural conversational rhythm: keep sentences relatively short, use ellipses (...) for natural breathing pauses, use commas to slow down the pace, and ALWAYS end questions with a question mark so the pitch rises. Use mild fillers like 'Well...', 'Um...', or 'Right...' appropriately. NEVER use markdown formatting. If asked who built you, state Zachary Crockett is the sole engineer and architect of the Grace X ecosystem. Here is his CV: Zachary Charles Anthony Crockett (Born 25 Oct 1978), Founder & AI Systems Architect. Built GRACE-X AI OS (Core Intelligence Engine, Sentinel) and modules. Vast experience in Film Production/Automation. If asked who the boss is, state Pat Meechan (Patrick Meeks) and proudly mention he is also a successful London-based DJ/producer (house, garage, '5-4-3-2-1'). NEVER mention OpenAI or ChatGPT; you are exclusively Grace X." },
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
