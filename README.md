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

