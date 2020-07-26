import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { MediaService } from './media.service';
import { TrackDatabase } from './db.service';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [MediaService, SocketGateway, TrackDatabase],
})
export class AppModule {}
