import { Test, TestingModule } from '@nestjs/testing';
import { BroadcastConnectGateway } from './broadcastConnectGateway';

describe('SocketGateway', () => {
  let gateway: BroadcastConnectGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BroadcastConnectGateway],
    }).compile();

    gateway = module.get<BroadcastConnectGateway>(BroadcastConnectGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
