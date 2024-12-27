import puppeteer from 'puppeteer';
import readline from 'readline';

// RL for processing terminal inputs
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function run() {
    // Pass in the URL to inspect/intercept network requests
    rl.question('Please enter the media URL: ', async (url) => {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        // Enable request interception
        await page.setRequestInterception(true);

        // Terminate after 500 lines of output
        let requestCount = 0;
        const maxRequests = 500;

        page.on('request', (req) => {
            console.log(`Request URL: ${req.url()}`);
            req.continue();
            requestCount++;

            if (requestCount >= maxRequests) {
                console.log(`Reached ${maxRequests} requests.`);
                browser.close();
                rl.close();
            }
        });

        await page.goto(url);

        console.log('Monitoring network requests. Script will terminate after 500 requests.');
    });
}

run();
