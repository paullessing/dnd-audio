import { MediaCollection } from '@dnd-audio/api-interfaces';
import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { MediaService } from './media.service';

@Controller()
export class AppController {
  constructor(
    private readonly mediaService: MediaService
  ) {}

  @Get('media/list')
  public getMediaList(): Promise<MediaCollection> {
    return this.mediaService.getMediaCollection();
  }

  @Get('media/scan') // TODO this should be a POST if not automatic
  public async scan(): Promise<MediaCollection> {
    return this.mediaService.scan();
  }

  @Get('media/stream/:filename')
  public async getFile(
    @Param('filename') fileName: string,
    @Res() res: Response
  ): Promise<void> {
    const { stream, size } = await this.mediaService.streamFile(fileName);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', size);

    stream.pipe(res);
  }
}
