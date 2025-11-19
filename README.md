# Googlebot Crawler

A tool to simulate Googlebot behavior for website testing and accessibility checks.

## Installation

```bash
yarn install
```

## Usage
Clean and run:
```bash
rm -rf screenshots && node crawl.js
```

## What it does
- Simulates Googlebot user agent
- Tests with normal IP and Google IP
- Takes screenshots for evidence
- Monitors redirects and JavaScript errors
- Saves results to `screenshots/` folder
