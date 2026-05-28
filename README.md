# ◉ BlindSpot Navigator — Real-Time Obstacle Detection

> Real-time camera → detects obstacles → warns via voice · রিয়েল-টাইম বাধা সনাক্তকরণ ও ভয়েস সতর্কতা

A Flask web application that uses **Groq AI Vision** to detect obstacles and hazards in real-time from a camera feed, then immediately reads warnings aloud via **Text-to-Speech** — in **English 🇬🇧** or **বাংলা 🇧🇩**.

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square)
![Flask](https://img.shields.io/badge/Flask-3.1.0-green?style=flat-square)
![Groq AI](https://img.shields.io/badge/Groq-AI%20Vision-purple?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-orange?style=flat-square)

---

## ✨ Features

- 📷 **Live Camera Feed** — Real-time environment scanning
- 🤖 **AI Obstacle Detection** — Powered by Groq + Llama 4 Vision
- 🔊 **Instant Voice Alerts** — Text-to-speech in English or Bangla
- 🚨 **Danger Level System** — Safe / Caution / Danger with color indicators
- 🔄 **Auto Scan Mode** — Scans every 3, 5, or 8 seconds automatically
- 🧭 **Direction Compass** — Shows which direction the hazard is in
- ⚠️ **Obstacle Tags** — Lists all detected obstacles
- 📋 **Scan History** — Log of all 20 recent scans
- 🇬🇧🇧🇩 **Bilingual** — Full English + Bangla support
- 🖼️ **Image Upload** — Scan from uploaded photos too

---

## 🚨 Danger Level System

| Level | Meaning | Action |
|---|---|---|
| ✅ SAFE | Path is clear | Proceed normally |
| ⚠️ CAUTION | Obstacles nearby | Slow down, be careful |
| 🚨 DANGER | Immediate hazard | STOP immediately |

---

## 🗂️ Project Structure

```
blindspot/
├── app.py                  ← Flask backend + Groq Vision API
├── requirements.txt        ← Python dependencies
├── Procfile                ← Render deployment config
├── .env.example            ← Environment variable template
├── .gitignore
├── README.md
├── templates/
│   └── index.html          ← Tactical HUD UI
└── static/
    ├── css/style.css       ← Military green dark theme
    └── js/main.js          ← Camera, scan, voice logic
```

---

## ⚙️ Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/gou-rab/blindspot-navigator.git
cd blindspot-navigator
```

### 2. Create virtual environment
```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up environment variables
```bash
cp .env.example .env
# Open .env and add your Groq API key
```

```env
GROQ_API_KEY=gsk_your_actual_key_here
FLASK_ENV=development
```

### 5. Run the app
```bash
python app.py
```

Visit 👉 `http://localhost:5000`

---

## 🔑 Get Free Groq API Key

1. Go to 👉 [console.groq.com](https://console.groq.com)
2. Sign up free with Google
3. Click **API Keys** → **Create API Key**
4. Copy and paste into your `.env` file

---

## 🚀 Deploy on Render (Free)

1. Push to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Settings:

| Field | Value |
|---|---|
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
| **Instance Type** | Free |

5. Add environment variable: `GROQ_API_KEY` = your key
6. Click **Create Web Service** ✅

---

## 📱 How to Use

1. Open the app in your browser
2. Select voice language — 🇬🇧 English or 🇧🇩 বাংলা
3. Click **Activate Camera** → allow camera access
4. Click **Scan Once** for a single scan
5. OR click **Auto Scan** for continuous scanning every few seconds
6. Voice alert reads the danger level and obstacles aloud
7. Click **Repeat Alert** to hear the last warning again
8. Toggle **Sound ON/OFF** to mute voice alerts

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python + Flask |
| AI Vision | Groq + Llama 4 Scout Vision |
| Voice | Web Speech API (browser-native) |
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Font | Share Tech Mono + Exo 2 |
| Deployment | Render |

---

## 👨‍💻 Author

**Gourab Bhadra** · [github.com/gou-rab](https://github.com/gou-rab)

---

*Built with ❤️ for accessibility · Powered by Groq AI*
