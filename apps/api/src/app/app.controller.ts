import { MediaCollection, Message } from '@dnd-audio/api-interfaces';
import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReadStream } from 'fs';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService
  ) {}

  @Get('hello')
  getData(): Message {
    return { message: __dirname + '\\' + __filename };
  }

  @Get('media/list')
  public getMediaList(): Promise<MediaCollection> {
    return this.appService.getMediaCollection();
  }

  @Get('media/:filename')
  public async getFile(
    @Param('filename') fileName: string,
    @Res() res: Response
  ): Promise<void> {
    const { stream, size } = await this.appService.streamFile(fileName);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', size);

    stream.pipe(res);
  }
}
