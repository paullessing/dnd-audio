import { Test } from '@nestjs/testing';

import { MediaService } from './media.service';

describe('AppService', () => {
  let service: MediaService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [MediaService],
    }).compile();

    service = app.get<MediaService>(MediaService);
  });

  describe('getData', () => {
    it('should return "Welcome to api!"', () => {
      expect(service.getData()).toEqual({ message: 'Welcome to api!' });
    });
  });
});
