import puppeteer from 'puppeteer';
import fs from 'fs';
import readline from 'readline';

// Create a terminal input interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function run() {
    // Ask user for the video URL
    rl.question('Please enter the Panopto video URL: ', async (url) => {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        const cookiesFilePath = './cookies.json';

        // Load cookies if available
        if (fs.existsSync(cookiesFilePath)) {
            const cookies = JSON.parse(fs.readFileSync(cookiesFilePath, 'utf-8'));
            await page.setCookie(...cookies);
            console.log('Loaded session cookies.');
        } else {
            console.log('No cookies found. Please log in manually.');
        }

        // Enable request interception
        await page.setRequestInterception(true);

        // Log all network requests
        page.on('request', (req) => {
            console.log(`Request URL: ${req.url()}`);
            req.continue();
        });

        // Navigate to the URL
        await page.goto(url);

        // Wait for the user to log in manually if no cookies are available
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

// Run the script
run();
