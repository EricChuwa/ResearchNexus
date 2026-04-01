# Research Nexus :: Synthesis

**Ask anything. Understand everything.**

Synthesis is an AI-powered research and learning intelligence engine. It breaks down any question into targeted search components, pulls information simultaneously from five high-quality sources, scores each result for relevance and credibility, and returns a direct structured answer — not a list of links.

It also generates personalised learning paths for any concept, helping students and developers go from curiosity to competence with a structured progression, real resources, and plain-language explanations at every stage.

Live at → [www.crimzonpeak.tech](https://www.crimzonpeak.tech)

---

## What Makes It Different

Most research tools find information. Synthesis **understands your question**.

When you ask *"Why does buoyancy act differently in water and oil?"* Synthesis does not search those exact words. It breaks the question into components — fluid density, Archimedes principle, viscosity differences — searches each component independently, scores every result for recency and credibility, then uses Claude to formulate a direct answer citing only sources it actually found.

Unlike ChatGPT or Perplexity, every citation is real and verifiable. Unlike Google Scholar, it searches across five source types simultaneously and answers in plain language. Unlike Notion or Obsidian, you do not need to organise anything.

---

## Features

### Research Mode
Ask any question in natural language. Synthesis breaks it into 3–4 targeted search queries, searches all sources simultaneously, scores results, and returns a structured answer with inline citations. From the answer you can view the source cards or generate a paper.

### Paper Generation
From any research result, generate a 500, 1000, or 2000 word academic essay or research paper. The paper uses only real sources that were found during your search — no hallucinated citations.

### Learn Mode
Enter any concept you want to understand. Select your level (beginner, intermediate, advanced) and your available time (1 week, 1 month, 3 months). Synthesis generates a 4-stage learning path with plain-language explanations, real-world analogies, common mistakes to avoid, curated resources per stage, and a concept check question at each stage. The full path is downloadable as a PDF.

### Source Scoring
Every source is scored before being passed to Claude using three weighted criteria:
- **Relevance** (50%) — how closely the source matches the query
- **Recency** (30%) — how recent the source is
- **Credibility** (20%) — source type weighted by academic rigour

In research mode, academic sources score highest. In learn mode, YouTube and Wikipedia score highest because beginners need accessible content, not research papers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Frontend | React, Framer Motion, inline CSS |
| AI Layer | Claude API (Anthropic) — claude-sonnet-4-20250514 |
| Web Servers | Nginx on Ubuntu 22.04 (Web01 + Web02) |
| Load Balancer | HAProxy with SSL termination |
| SSL | Let's Encrypt via Certbot |
| Process Manager | PM2 |
| Firewall | UFW |

---

## APIs

| API | Purpose | Mode |
|---|---|---|
| [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) | Encyclopedic summaries | Research + Learn |
| [arXiv API](https://arxiv.org/help/api/) | Academic preprints | Research |
| [Semantic Scholar API](https://api.semanticscholar.org/) | Peer reviewed papers | Research |
| [YouTube Data API v3](https://developers.google.com/youtube/v3) | Educational video content | Research + Learn |
| [NewsAPI](https://newsapi.org/docs) | News and articles | Research |
| [Anthropic Claude API](https://docs.anthropic.com/) | Question answering, synthesis, paper generation, learning paths | All |

All APIs are called server-side. No key is ever exposed to the browser.

---

## Project Structure
```
nexus/
├── app/
│   ├── api/
│   │   ├── search/
│   │   │   └── route.js        # Keyword search endpoint (used by UI)
│   │   ├── question/
│   │   │   └── route.js        # Question answering — breaks query, searches, answers
│   │   ├── paper/
│   │   │   └── route.js        # Academic paper generation
│   │   ├── learn/
│   │   │   └── route.js        # Learning path generation
│   │   └── synthesize/
│   │       └── route.js        # Legacy synthesis endpoint
│   ├── lib/
│   │   └── fetchSources.js     # Shared fetch + scoring utility used by all routes
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.js
│   └── page.js                 # Main UI — Research mode + Learn mode
├── .env.local                  # API keys (not committed)
├── .gitignore
├── next.config.mjs
├── package.json
└── README.md
```

---

## Running Locally

#### 1. Clone the repository
```bash
git clone https://github.com/EricChuwa/ResearchNexus.git
cd ResearchNexus/nexus
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Create `.env.local`

Create a file called `.env.local` in the `nexus/` folder with the following:
```
ANTHROPIC_API_KEY=your_anthropic_key
YOUTUBE_API_KEY=your_youtube_key
NEWS_API_KEY=your_newsapi_key
SEMANTIC_SCHOLAR_KEY=your_semantic_scholar_key
```

Key registration links:
- Anthropic → https://console.anthropic.com
- YouTube Data API v3 → https://console.cloud.google.com
- NewsAPI → https://newsapi.org/register
- Semantic Scholar → https://api.semanticscholar.org/product/api

Wikipedia and arXiv require no API keys.

#### 4. Run the development server
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Deployment

The application runs on two Nginx web servers behind an HAProxy load balancer. All traffic is served over HTTPS with automatic HTTP to HTTPS redirection. Traffic is distributed between both servers using round-robin load balancing.

#### Infrastructure

| Server | Role | IP |
|---|---|---|
| Web01 | Nginx reverse proxy → Next.js on port 3000 | 54.173.55.181 |
| Web02 | Nginx reverse proxy → Next.js on port 3000 | 54.211.203.174 |
| Lb01 | HAProxy load balancer + SSL termination | 18.208.150.244 |

#### Access Points

| URL | Description |
|---|---|
| https://www.crimzonpeak.tech | Primary — HTTPS via load balancer |
| http://web-01.crimzonpeak.tech | Web01 direct |
| http://web-02.crimzonpeak.tech | Web02 direct |

#### Deploying To A New Server
```bash
# SSH into the server
ssh ubuntu@YOUR_SERVER_IP

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone the repository
git clone https://github.com/EricChuwa/ResearchNexus.git
cd ResearchNexus/nexus

# Install dependencies
npm install

# Create environment variables
nano .env.local
# Add all four API keys

# Build and start
npm run build
pm2 start npm --name "synthesis" -- start
pm2 save

# Install and configure Nginx
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/synthesis
```

Nginx config for each web server:
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        add_header X-Served-By "web-01";
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/synthesis /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo service nginx restart
```

#### Configuring The Load Balancer
```bash
sudo apt install haproxy -y

# Obtain SSL certificate
sudo certbot certonly --standalone -d www.yourdomain.tech

# Combine certificate files
sudo cat /etc/letsencrypt/live/www.yourdomain.tech/fullchain.pem \
    /etc/letsencrypt/live/www.yourdomain.tech/privkey.pem \
    | sudo tee /etc/ssl/private/www.yourdomain.tech.pem
```

HAProxy config (`/etc/haproxy/haproxy.cfg`):
```haproxy
global
    tune.ssl.default-dh-param 2048

defaults
    mode http
    timeout connect 5000
    timeout client  50000
    timeout server  50000

frontend www_https
    bind *:443 ssl crt /etc/ssl/private/www.yourdomain.tech.pem
    default_backend web_servers

frontend www_http
    bind *:80
    redirect scheme https code 301 if !{ ssl_fc }

backend web_servers
    balance roundrobin
    server web-01 54.173.55.181:80 check
    server web-02 54.211.203.174:80 check
```

#### Verifying Load Balancer Traffic Distribution
```bash
curl -sI https://www.crimzonpeak.tech | grep X-Served-By
# Run multiple times to see it alternate between web-01 and web-02
```

---

## Challenges & How I Overcame Them

#### 1. API Key Security In A Frontend Application
**Challenge:** Exposing API keys directly in frontend JavaScript means anyone can open DevTools and steal them.

**Solution:** Used Next.js API routes as a server-side proxy. All external API calls happen inside `app/api/` route handlers where keys are stored as environment variables. The browser only ever calls `/api/question` — it never touches Wikipedia, YouTube, or Claude directly.

#### 2. DOMParser Not Available In Node.js
**Challenge:** arXiv returns XML instead of JSON. The browser's `DOMParser` API was the obvious solution — but it doesn't exist in Node.js where API routes run.

**Solution:** Replaced DOMParser with manual XML parsing using regular expressions, which work in both browser and server environments.

#### 4. Internal HTTP Calls Failing On Deployment
**Challenge:** The question and paper routes initially called `/api/search` internally via HTTP fetch. On the deployed server this returned an HTML error page instead of JSON, silently breaking both features.

**Solution:** Extracted all fetch logic into a shared utility (`app/lib/fetchSources.js`) and imported it directly into each route that needed it, eliminating the internal HTTP dependency entirely.

#### 5. Rate Limiting Across Multiple APIs
**Challenge:** Repeatedly calling Wikipedia, arXiv, and Semantic Scholar during development triggered 429 rate limit errors.

**Solution:** Added a `User-Agent` header to Wikipedia requests as required by their API policy. Registered for a Semantic Scholar API key for higher limits. Added `Promise.allSettled` so a single rate-limited API doesn't fail the entire request.

#### 6. HAProxy SSL Termination Certificate Format
**Challenge:** HAProxy requires a single combined `.pem` file containing both the certificate chain and private key. The Let's Encrypt documentation does not make this obvious.

**Solution:** Used `cat` to concatenate `fullchain.pem` and `privkey.pem` into a single file that HAProxy could read for SSL termination.

#### 7. Data Normalization Across Five APIs
**Challenge:** Every API returns data in a completely different shape. Wikipedia uses `extract`, arXiv uses `summary`, Semantic Scholar uses `abstract`, YouTube nests everything under `snippet`.

**Solution:** Built a `normalize()` function in the shared fetch utility that maps every possible field name into one consistent shape before data touches the UI. The frontend never needs to know which API a result came from.

---

## Credits & Attributions

#### APIs & Data Sources

| Service | Purpose | Documentation |
|---|---|---|
| [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) | Encyclopedic summaries | https://en.wikipedia.org/api/rest_v1/ |
| [arXiv API](https://arxiv.org/help/api/) | Academic preprints | https://arxiv.org/help/api/ |
| [Semantic Scholar API](https://api.semanticscholar.org/) | Peer reviewed papers | https://api.semanticscholar.org/ |
| [YouTube Data API v3](https://developers.google.com/youtube/v3) | Educational video content | https://developers.google.com/youtube/v3 |
| [NewsAPI](https://newsapi.org/) | News articles | https://newsapi.org/docs |
| [Anthropic Claude API](https://docs.anthropic.com/) | AI synthesis, question answering, paper generation, learning paths | https://docs.anthropic.com/ |

#### Frameworks & Libraries

| Library | Purpose | Link |
|---|---|---|
| [Next.js](https://nextjs.org/) | Full stack React framework | https://nextjs.org/ |
| [React](https://react.dev/) | UI component library | https://react.dev/ |
| [Framer Motion](https://www.framer.com/motion/) | Animations and transitions | https://www.framer.com/motion/ |
| [jsPDF](https://github.com/parallax/jsPDF) | Client-side PDF generation | https://github.com/parallax/jsPDF |

#### Infrastructure

| Tool | Purpose | Link |
|---|---|---|
| [Nginx](https://nginx.org/) | Reverse proxy on web servers | https://nginx.org/ |
| [HAProxy](https://www.haproxy.org/) | Load balancer with SSL termination | https://www.haproxy.org/ |
| [PM2](https://pm2.keymetrics.io/) | Node.js process manager | https://pm2.keymetrics.io/ |
| [Let's Encrypt / Certbot](https://letsencrypt.org/) | Free SSL certificate | https://letsencrypt.org/ |
| [AWS EC2](https://aws.amazon.com/ec2/) | Cloud server infrastructure | https://aws.amazon.com/ec2/ |
| [UFW](https://help.ubuntu.com/community/UFW) | Firewall configuration | https://help.ubuntu.com/community/UFW |

#### Acknowledgements

- **Anthropic** for Claude API access and documentation
- **Wikipedia Foundation** for their free and open REST API
- **Allen Institute for AI** for the Semantic Scholar API
- **Bridge Rwanda** for providing the context and motivation to build a tool that genuinely serves learners
- All open source contributors whose libraries made this project possible
