# ResearchNexus 
**Search less. Understand more. Synthesized for you.**

ResearchNexus is an intelligent research engine that aggregates and synthesizes information from multiple high-quality sources into a single, structured output. Instead of jumping between tabs, users can search any topic and instantly receive curated insights drawn from academic papers, encyclopedic knowledge, and multimedia content.

Powered by multi-source APIs and an AI synthesis layer via Anthropic’s Claude, ResearchNexus transforms raw information into **coherent, decision-ready understanding**.

Hosted Live at :: www.crimzonpeak.tech
Demo Video :: 

--- 
## Why Synthesis Exists

Modern research is inefficient by design.

You search a topic and end up:
- Opening 15+ tabs
- Skimming incomplette or redundant information
- Struggling to connect insights across sources

What should be a **thinking process** becomes a **navigation problem**.

For a student exploring Machine Learning, a developer researching a new framework, or a founder validating an idea—this friction compounds quickly.

**The problem is not lack of information. It is lack of synthesis.**

ResearchNexus is built to close that gap.
--- 

## How it Works

You enter a topic. One input.

In seconds, ResearchNexus:

- Pulls structured knowledge from **Wikipedia**
- Fetches relevant academic papers from **arXiv**
- Extracts research insights from **Semantic Scholar**
- Surfaces explanatory and educational content from **YouTube**
- Aggregates everything into a unified dataset
- Sends the compiled context to Claude AI
- Returns a refined, structured synthesis of the topic

Allowing you to navigate the sources all in one place. The output is not just information it is **understanding**.
---

## Tech Stack
Built with a lightweight, execution-focused architecture

| Layer        | Technology |
|--------------|------------|
| Frontend     | Next.js, Tailwind CSS |
| AI Layer     | Claude API (Anthropic) |
| Hosting      | Nginx on Ubuntu 22.04 |
| Load Balancing | HAProxy with round-robin distribution |
| SSL          | Certbot |
| Data Sources (APIs) | Wikipedia API, arXiv API, Semantic Scholar API, YouTube Data API |

---

## APIs 

| API | What It Does |
|-----|-------------|
| Wikipedia API | Retrieves foundational topic knowledge |
| arXiv API | Fetches academic research papers |
| Semantic Scholar API | Provides structured research insights and metadata |
| YouTube Data API | Returns relevant educational video content |
| Claude API | Synthesizes all collected data into structured insights |

All API interactions are designed to:
- Handle failures gracefully  
- Maintain usability even under partial data availability  

---

## Project Structure

``` 
NEXUS/
├── app/
│   ├── api/
│   │   ├── search/
│   │   │   └── route.js        # API route for handling topic search
│   │   └── synthesize/
│   │       └── route.js        # API route for AI synthesis with Claude
│   ├── favicon.ico
│   ├── globals.css             # Global styles
│   ├── layout.js               # Layout component for pages
│   └── page.js                 # Main page component
├── public/                     # Static assets (images, icons, etc.)
├── .gitignore                  # Files to exclude from git
├── eslint.config.mjs           # ESLint configuration
├── jsconfig.json               # JS path resolution and aliases
├── next.config.mjs             # Next.js configuration
├── package.json                # Project dependencies and scripts
├── package-lock.json           # Lock file for npm
├── postcss.config.mjs          # PostCSS configuration
└── README.md                   # This file
```

---

## Running Locally

#### Clone Repo
```
git clone https://github.com/EricChuwa/ResearchNexus.git
cd ResearchNexus
```
#### Install dependencies
```
npm install
```
#### create .env.local file
```
CLAUDE_API_KEY=your_claude_key
YOUTUBE_API_KEY=your_youtube_key
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_key
```
#### Run the development sever
```
npm run dev
```
Open http://localhost:3000 to see the app in your browser.

---

## Deployment
The application makes use of two Nginx webservers that lay behind an HAProxy load balancer. All the trafic is served over HTTPS with automatic HTTP to HTTPS redirection.

#### Infrastructure

| Server | Role | IP |
|--------|------|----|
| Web01  | Nginx Web Server | 54.173.55.181 |
| Web02  | Nginx Web Server | 54.211.203.174 |
| Lb01   | HAProxy load balancer | 18.208.150.244 |

#### Access Points

| URL | Description |
|-----|-------------|
| https://www.crimzonpeak.tech/ | Primary HTTPS via Load Balancer |
| http://web-01.crimzonpeak.tech/ | Web01 Direct | 
| http://web-02.crimzonpeak.tech/ | Web02 Direct |
| lb-01.crimzonpeak.tech          | Lb-01 Direct |

---

# Challenges and How They Were Solved

#### 1. API Key Security In A Frontend App
**Challenge:** Exposing API keys directly in frontend JavaScript 
is a security vulnerability, anyone can open DevTools and steal them.

**Solution:** Used Next.js API routes as a server-side proxy layer. 
All external API calls happen in `app/api/` route handlers where keys 
are stored as environment variables and never exposed to the browser.

#### 2. DOMParser Not Available In Node.js
**Challenge:** arXiv returns XML instead of JSON. The browser's 
`DOMParser` API was used to parse it, but `DOMParser` doesn't 
exist in Node.js where API routes run.

**Solution:** Replaced DOMParser with manual XML parsing using 
regular expressions, which work in both browser and server environments.

---

# Credits & Attributions

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
| [Tailwind CSS](https://tailwindcss.com/) | Utility CSS framework | https://tailwindcss.com/ |

#### Infrastructure & Deployment

| Tool | Purpose | Link |
|---|---|---|
| [Nginx](https://nginx.org/) | Reverse proxy on web servers | https://nginx.org/ |
| [HAProxy](https://www.haproxy.org/) | Load balancer with SSL termination | https://www.haproxy.org/ |
| [PM2](https://pm2.keymetrics.io/) | Node.js process manager | https://pm2.keymetrics.io/ |
| [Let's Encrypt / Certbot](https://letsencrypt.org/) | Free SSL certificate | https://letsencrypt.org/ |
| [AWS EC2](https://aws.amazon.com/ec2/) | Cloud server infrastructure | https://aws.amazon.com/ec2/ |
| [UFW](https://help.ubuntu.com/community/UFW) | Firewall configuration | https://help.ubuntu.com/community/UFW |

### Fonts

| Font | Foundry | Usage |
|---|---|---|
| [Georgia](https://docs.microsoft.com/en-us/typography/font-list/georgia) | Microsoft | Display headings and body text |
| [DM Sans](https://fonts.google.com/specimen/DM+Sans) | Google Fonts | UI labels and interface text |

### Acknowledgements

- **Anthropic** for Claude API access and documentation
- **Wikipedia Foundation** for their free and open REST API
- **Allen Institute for AI** for the Semantic Scholar API
- **Bridge Rwanda** for providing the context and motivation to build a tool that genuinely serves learners
- All open source contributors whose libraries made this project possible


