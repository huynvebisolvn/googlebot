const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// rm -rf screenshots && node test.js

(async () => {
  const testSites = [
    {
      name: 'booking',
      url: 'https://booking.ebica.jp/webrsv/vacant/e014169901/32277',
      screenshotsDir: 'screenshots-booking'
    },
    {
      name: 'tabelog',
      url: 'https://tabelog.com/tokyo/A1314/A131402/13296426/',
      screenshotsDir: 'screenshots-tabelog'
    }
  ];

  for (const site of testSites) {
    // Create screenshots directory if it doesn't exist
    if (!fs.existsSync(site.screenshotsDir)) {
      fs.mkdirSync(site.screenshotsDir, { recursive: true });
      console.log(`Created ${site.screenshotsDir} directory`);
    }
  
  // Test scenarios with main Google crawler IP ranges
  const scenarios = [
    {
      name: 'Screen Normal IP',
      description: 'Complete browser simulation with normal IP',
      useGoogleIP: false,
    },
    {
      name: 'Primary Googlebot',
      description: 'Primary Googlebot IP (66.249.79.142)',
      useGoogleIP: true,
      googleIP: '66.249.79.142',
    },
    {
      name: 'Googlebot crawler',
      description: 'Google crawler IP range 66.249.64.0/19 (66.249.65.100)',
      useGoogleIP: true,
      googleIP: '66.249.65.100',
    },
    {
      name: 'Google Mobile crawler',
      description: 'Google Mobile crawler IP (216.58.197.46)',
      useGoogleIP: true,
      googleIP: '216.58.197.46',
    },
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Storage for results
    let finalUrl = '';
    let jsErrors = [];
    
    // Monitor all HTTP responses
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      // Track any redirects
      if (status >= 300 && status < 400) {
        const location = response.headers()['location'];
        if (location) {
          console.log(`🔄 Redirect detected: ${url} (${status}) → ${location}`);
        }
      }
    });
    
    // Monitor JavaScript errors
    page.on('pageerror', error => {
      jsErrors.push({
        message: error.message,
        timestamp: new Date().toISOString()
      });
      console.log(`❌ JS Error: ${error.message}`);
    });
    
    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🚨 Console Error: ${msg.text()}`);
      }
    });
    
    try {
      console.log(`\n📱 ${scenario.name}: ${scenario.description}`);
      
      // Set Googlebot user agent
      await page.setUserAgent('Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
      await page.setViewport({ width: 375, height: 667 });
      
      // Set Google IP headers if needed
      if (scenario.useGoogleIP) {
        await page.setExtraHTTPHeaders({
          'X-Real-IP': scenario.googleIP,
          'X-Forwarded-For': scenario.googleIP,
          'X-Originating-IP': scenario.googleIP,
          'Referer': ''
        });
      }
      await page.goto(site.url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      finalUrl = page.url();
      // Check for redirect
      if (finalUrl !== site.url) {
        console.log(`PAGE REDIRECT DETECTED: ${site.url} -> ${finalUrl}`);
        // Check if redirected to sorry page
        if (finalUrl.includes('/sorry')) {
          console.log(`PAGE REDIRECT DETECTED: ${site.url} -> /sorry`);
        }
      }

      // Report JavaScript errors
      if (jsErrors.length > 0) {
        console.log(`JavaScript errors: ${jsErrors.length}`);
        jsErrors.forEach(error => {
          console.log(`${error.message}`);
        });
      }
      
      // Take screenshot for ALL test cases (evidence)
      const screenshotName = `${scenario.name.replace(/[^a-zA-Z0-9]/g, '_')}_${i + 1}.png`;
      const screenshotPath = path.join(site.screenshotsDir, screenshotName);
      try {
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: true 
        });
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
      } catch (screenshotError) {}
    } catch (err) {}

    await browser.close();
    console.log(''); // Empty line
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n✅ Completed testing ${site.name}`);
  console.log('='.repeat(50));
  }
})();
