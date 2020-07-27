import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { MediaService } from './media.service';
import { TrackDatabase } from './track-database.service';
import { BroadcastConnectGateway } from './broadcastConnectGateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [MediaService, BroadcastConnectGateway, TrackDatabase],
})
export class AppModule {}
