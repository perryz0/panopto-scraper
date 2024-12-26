import puppeteer from 'puppeteer';
import readline from 'readline';

// Create a readline interface to prompt for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Prompt the user for a URL
rl.question('Please enter the Panopto video URL: ', async (videoUrl) => {
    if (!videoUrl) {
        console.error('Error: No URL provided.');
        rl.close();
        return;
    }

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on('request', (req) => {
        console.log(`Request URL: ${req.url()}`);
        req.continue();
    });

    await page.goto(videoUrl); // Use the provided URL
    await browser.close();

    rl.close();
});
