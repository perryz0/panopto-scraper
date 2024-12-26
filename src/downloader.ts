import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import { createWriteStream } from 'fs';

export async function downloadVideos(url: string, outputDir: string): Promise<string> {
  const filename = path.join(outputDir, path.basename(new URL(url).pathname));

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  const writer = createWriteStream(filename);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filename));
    writer.on('error', reject);
  });
}

export async function mergeVideos(
  videoFiles: string[],
  outputFilename: string,
  options: { crf: number; x265: boolean; keepOriginals: boolean }
): Promise<void> {
  const ffmpegCommand = ffmpeg();

  for (const videoFile of videoFiles) {
    ffmpegCommand.input(videoFile);
  }

  ffmpegCommand
    .outputOptions([
      `-vcodec ${options.x265 ? 'libx265' : 'libx264'}`,
      `-crf ${options.crf}`,
    ])
    .save(outputFilename)
    .on('end', () => {
      console.log('Merge complete!');
      if (!options.keepOriginals) {
        videoFiles.forEach((file) => fs.unlinkSync(file));
      }
    })
    .on('error', (err) => {
      console.error(`Error during merging: ${err.message}`);
      throw err;
    });
}
