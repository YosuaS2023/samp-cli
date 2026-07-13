import axios from 'axios';
import fs from 'fs-extra';
import { logger } from './logger.js';

export const downloadFile = async (url: string, outputPath: string): Promise<void> => {
  try {
    logger.info(`Mengunduh dari: ${url}`);
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: { 'Connection': 'close' }
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', (err) => {
        writer.destroy();
        if (fs.existsSync(outputPath)) fs.removeSync(outputPath);
        reject(err);
      });
    });
  } catch (error) {
    if (fs.existsSync(outputPath)) fs.removeSync(outputPath);
    throw error;
  }
};