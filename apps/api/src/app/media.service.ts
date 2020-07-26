import { MediaCollection, Track } from '@dnd-audio/api-interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { createReadStream, ReadStream } from 'fs';
import fs from 'fs-extra';
import * as path from 'path';
import { environment } from '../environments/environment';
import { IAudioMetadata, parseFile } from 'music-metadata';
import { TrackDatabase } from './track-database.service';

type ReplaceDeep<T, A, B> = {
  [K in keyof T]: Replace<T[K], A, B>;
}

type Replace<T, Match, Replacement> = T extends Match ? Replacement :
  T extends (infer A)[] ? Replace<A, Match, Replacement>[]:
  T extends object ? ReplaceDeep<T, Match, Replacement> :
  T;

type SanitizedMetadata = ReplaceDeep<
  Omit<IAudioMetadata, 'native'>, // Contains keys with a '.' in them which messed up the DB, and we don't need them so we won't store them
  Buffer,
  string
>;

@Injectable()
export class MediaService {

  private mediaCollection: MediaCollection | null = null;
  private logger: Logger = new Logger('MediaService');

  constructor(
    private database: TrackDatabase,
  ) {}

  public async getMediaCollection(): Promise<MediaCollection> {
    if (!this.mediaCollection) {
      this.mediaCollection = {
        tracks: await this.database.db.find({}),
      };
    }

    return this.mediaCollection;
  }

  public async streamFile(fileName: string): Promise<{
    stream: ReadStream,
    size: number
  }> {
    const filePath = path.join(environment.mediaDir, fileName);
    const exists = await fs.pathExists(filePath);

    if (!exists) {
      return null;
    } else {
      const size = (await fs.stat(filePath)).size;
      const stream = createReadStream(filePath);

      return { stream, size };
    }
  }

  public async scan(): Promise<MediaCollection> {
    const tracks = await this.scanDir(environment.mediaDir, []);

    this.logger.debug(JSON.stringify(tracks[0].metadata.common.picture))

    // this.logger.debug('Storing ' + JSON.stringify(tracks[0], (key, value) => Array.isArray(value) ? value.length > 4 ? value.slice(0,3).concat('...') : value : value, 2));

    const resultingTracks = await this.database.db.insert(tracks);

    this.mediaCollection = {
      tracks: resultingTracks
    };

    return this.mediaCollection;
  }

  private async scanDir(dirName: string, results: Track[]): Promise<Track[]> {
    const dir = await fs.readdir(dirName);
    for (const file of dir) {
      if (file[0] === '.') {
        continue;
      }

      const fileName = path.join(dirName, file);
      const stat = await fs.stat(fileName);
      if (stat.isDirectory()) {
        await this.scanDir(fileName, results); // TODO this could possibly run in parallel
      } else {
        const metadata = await parseFile(fileName);
        results.push({
          filename: file,
          size: stat.size,
          metadata: this.sanitizeMetadata(metadata),
        });
      }
    }
    return results;
  }

  // TODO this should be in the DB class or a separate TrackSanitizer class
  private sanitizeMetadata(metadata: IAudioMetadata): SanitizedMetadata {
    const returnValue = this.sanitizeBuffers(metadata);
    delete returnValue.native;
    return returnValue;
  }

  private sanitizeBuffers<T>(value: T): Replace<T, Buffer, string> {
    if (typeof value !== 'object') {
      return value as Replace<T, Buffer, string>;
    }
    if (!value) {
      return value as Replace<T, Buffer, string>;
    }
    if (value instanceof Buffer) {
      return value.toString('base64') as Replace<T, Buffer, string>;
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.sanitizeBuffers(v)) as Replace<T, Buffer, string>;
    }
    const copy = {} as any;
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        copy[key] = this.sanitizeBuffers(value[key]);
      }
    }
    return copy;
  }
}
