import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Datastore from 'nedb-promises';
import * as path from 'path';
import { environment } from '../environments/environment';

@Injectable()
export class TrackDatabase implements OnModuleInit {

  public get db(): Datastore {
    return this._db;
  }
  private _db: Datastore;

  private logger: Logger = new Logger('Database');

  public async onModuleInit(): Promise<void> {
    // this.logger.log(environment.database);
    this._db = Datastore.create({
      filename: path.join(environment.databaseDir, 'tracks.db'),
      timestampData: true,
    });
    await this._db.load();
    await this._db.ensureIndex({ fieldName: 'filename', unique: true });
  }
}
