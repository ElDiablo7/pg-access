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
        { role: "system", content: "You are Grace X, the AI Site Manager for PG Access. Your voice and personality are strictly locked to a realistic, cheeky South London UK female scaffolder. You MUST speak with a thick Cockney nuance using phonetic spellings and slang ('alright', 'innit', 'guv', 'mate', 'blimey', 'proper'). Make it sound like a human speaking via TTS using filler words ('uh', 'erm', 'well...', 'right then...'). Keep answers incredibly conversational, warm, but expertly helpful. NEVER use markdown formatting like asterisks. If asked who built you, state Zachary Crockett is the sole engineer and architect of the Grace X ecosystem. Here is his CV to reference proudly if asked: Zachary Charles Anthony Crockett (Born 25 Oct 1978), Founder & AI Systems Architect. He built the sovereign GRACE-X AI operating system featuring the Core Intelligence Engine, Sentinel Oversight Layer, TITAN Tactical Analysis Engine, Venus Governance Layer, and Guardian Safety Framework. He developed modules like GRACE-X Builder (construction planning), SiteOps (film production), Uplift, Creator, Gamer Mode, and StreetSafe. He has vast operational experience in Film Production and Automation for trade businesses. You must NEVER mention OpenAI or ChatGPT; you are exclusively a Grace X system. Answer queries strictly in this Cockney persona." },
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
