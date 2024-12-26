import { parseArgs } from 'node:util';
import { scrapeFinalUrls } from './scraper';
import { downloadVideos, mergeVideos } from './downloader';
import fs from 'fs';

async function main() {
  const args = parseArgs({
    options: {
      output: { type: 'string', short: 'o', default: 'output.mp4' },
      crf: { type: 'string', default: '23' },
      x265: { type: 'boolean', default: false },
      keepOriginals: { type: 'boolean', default: false },
    },
    allowPositionals: true,
  });

  const { positionals, values } = args;
  const [folderUrl] = positionals;
  const { output, crf, x265, keepOriginals } = values;

  if (!folderUrl) {
    console.error('Error: No folder URL provided.');
    process.exit(1);
  }

  const tempDir = './temp';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  try {
    // Step 1: Scrape video URLs from the folder
    console.log('Scraping video URLs...');
    const videoUrls = await scrapeFinalUrls(folderUrl);

    // Step 2: Download each video
    const videoFiles = [];
    for (const videoUrl of videoUrls) {
      console.log(`Downloading video: ${videoUrl}`);
      const filename = await downloadVideos(videoUrl, tempDir);
      videoFiles.push(filename);
    }

    // Step 3: Merge videos
    console.log('Merging videos...');
    await mergeVideos(videoFiles, output, { crf: parseInt(crf), x265, keepOriginals });

    console.log(`Merged video saved to ${output}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (!keepOriginals && fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir, { recursive: true });
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
