import { Injectable, Logger } from '@nestjs/common';
import { MediaCollection, Message } from '@dnd-audio/api-interfaces';
import { createReadStream, ReadStream } from 'fs';
import fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class AppService {

  private mediaCollection: MediaCollection | null = null;
  private logger: Logger = new Logger('AppService');

  private readonly mediaDir: string;

  constructor() {
    this.mediaDir = path.join(__dirname, '../../../media');
  }

  getData(): Message {
    return { message: 'Welcome to api!' };
  }

  public async getMediaCollection(): Promise<MediaCollection> {
    if (!this.mediaCollection) {
      this.mediaCollection = {
        tracks: [],
      };

      this.logger.verbose('Scanning media directory', this.mediaDir);
      const dir = await fs.readdir(this.mediaDir);
      for (const file of dir) {
        if (file[0] === '.') {
          continue;
        }

        this.mediaCollection.tracks.push({ filename: file });
      }
    }

    return this.mediaCollection;
  }

  public async streamFile(fileName: string): Promise<{
    stream: ReadStream,
    size: number
  }> {
    const filePath = path.join(this.mediaDir, fileName);
    const exists = await fs.pathExists(filePath);

    if (!exists) {
      return null;
    } else {
      const size = (await fs.stat(filePath)).size;
      const stream = createReadStream(filePath);

      return { stream, size };
    }
  }
}
