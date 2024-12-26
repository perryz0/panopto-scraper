import puppeteer from 'puppeteer';

export async function scrapeFinalUrls(folderUrl: string): Promise<string[]> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
  
    try {
      await page.goto(folderUrl, { waitUntil: 'networkidle2' });
  
      // Extract all video URLs from the folder
      const videoUrls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a.video-link')); // Adjust selector
        return links
          .map((link) => link.getAttribute('href'))
          .filter((url): url is string => url !== null); // Type guard to filter out null values
      });
  
      if (!videoUrls.length) {
        throw new Error('No video URLs found on the folder page.');
      }
  
      return videoUrls;
    } finally {
      await browser.close();
    }
  }
  