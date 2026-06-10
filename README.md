# Password Strength Analyzer & Breach Checker

A client-side cyber security demo that scores password strength in real time, estimates crack time, generates strong passwords, and checks Have I Been Pwned — all in the browser with SHA-1 k-anonymity (only the first 5 hash characters are sent).

## Live Demo

<!-- Replace with your deployed URL after publishing -->
`https://prabhu007k-password-strength-analyzer.netlify.app/`

## Features

### Password Checker
- **Real-time strength scoring** — entropy calculation with live mini bar while typing
- **Animated strength meter** — color-coded bar with pulse on update; red flash if breached
- **Rule checks** — length, uppercase, lowercase, digits, symbols, common patterns
- **Crack-time estimate** — human-readable time to crack at 10B guesses/sec
- **Breach lookup** — Have I Been Pwned range API (k-anonymity)
- **Privacy-first** — password never sent in plain text; SHA-1 hashing runs locally

### Password Generator
- **Toggle mode** — switch between Checker and Generator tabs
- **Custom length** — slider from 8–32 characters
- **Character options** — lowercase, uppercase, numbers, symbols
- **Instant analysis** — generated passwords are scored and breach-checked automatically
- **Copy to clipboard** — one-click copy of generated password

### UI
- **Matrix-style background** — animated falling green digits (canvas)
- **Glowing header** — cyber-themed title synced with the rain effect
- **Educational panel** — explains how k-anonymity works

## Tech Stack

- HTML5, CSS3
- Vanilla JavaScript (ES6+)
- Canvas (Matrix rain animation)
- Have I Been Pwned Pwned Passwords API
- Web Crypto API (SHA-1, secure random generation)

## Project Structure

```
├── index.html
├── serve.py            # Local dev server (port 5001)
├── start.bat           # Windows quick start
├── css/
│   └── style.css
├── js/
│   ├── app.js          # Checker, generator, entropy, HIBP
│   └── matrix.js       # Matrix rain background
├── description.txt
└── README.md
```

## Run Locally

No build step or npm install required.

**Option 1 — Python server (recommended)**

```bash
python serve.py
```

Then visit `http://localhost:5001`

**Option 2 — Windows batch file**

Double-click `start.bat`.

**Option 3 — Open directly**

Open `index.html` in your browser. Map search and breach API calls require internet access.

## Deploy to GitHub Pages

1. Create a repository and push this folder’s contents to the **root** of the repo.
2. Go to **Settings → Pages → Deploy from branch → main → / (root)**.
3. Your site will be live at `https://<username>.github.io/<repo-name>/`.
4. Update the Live Demo URL in this README after deploy.

Upload at minimum: `index.html`, `css/`, and `js/`.

## Deploy to Netlify

1. Push this folder to GitHub or use [Netlify Drop](https://app.netlify.com/drop).
2. **Build command:** leave empty  
3. **Publish directory:** `.` (project root)
4. Deploy to `https://<site-name>.netlify.app/`

## Author

K Prabhu
