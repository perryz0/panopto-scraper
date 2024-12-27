import puppeteer from 'puppeteer';
import fs from 'fs';
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

        const cookiesFilePath = './cookies.json';

        // Enable request interception, then log all requests
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            console.log(`Request URL: ${req.url()}`);
            req.continue();
        });

        await page.goto(url);

        // Manual log in.
        if (!fs.existsSync(cookiesFilePath)) {
            console.log('Please log in manually. Once logged in, press ENTER to continue.');

            rl.question('', async () => {
                // Save cookies after login
                const cookies = await page.cookies();
                fs.writeFileSync(cookiesFilePath, JSON.stringify(cookies, null, 2));
                console.log('Session cookies saved.');

                await browser.close();
                rl.close();
            });
        } else {
            await browser.close();
            rl.close();
        }
    });
}

run();
