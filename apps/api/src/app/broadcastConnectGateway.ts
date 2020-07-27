import { Logger } from '@nestjs/common';
import {
  ConnectedSocket, MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class BroadcastConnectGateway implements OnGatewayConnection, OnGatewayDisconnect {

  private broadcaster: string;

  @WebSocketServer()
  private server: Server;

  private logger: Logger = new Logger('BroadcastConnectGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('broadcaster')
  public onBroadcaster(@ConnectedSocket() client: Socket): void {
    this.broadcaster = client.id;
    this.logger.debug(`New broadcaster: ${this.broadcaster}`);
    client.broadcast.emit('broadcaster');
  }

  @SubscribeMessage('watcher')
  public onWatcher(@ConnectedSocket() client: Socket): void {
    this.logger.debug(`New watcher: ${JSON.stringify([this.broadcaster, client.id])}`);
    this.server.to(this.broadcaster).emit('watcher', client.id);
  }

  @SubscribeMessage('offerToWatcher')
  public onOffer(broadcaster: Socket, [watcherId, description]) {
    this.logger.verbose(`Broadcaster made an offer to watcher ${watcherId}: ${description}`);
    this.server.to(watcherId).emit('offerFromBroadcaster', broadcaster.id, description);
  }

  @SubscribeMessage('answerToBroadcaster')
  public onAnswer(client: Socket, [broadcasterId, description]) {
    this.logger.verbose(`Answer from watcher ${client.id} to broadcaster ${broadcasterId}: ${description}`);
    this.server.to(broadcasterId).emit('answerFromWatcher', client.id, description);
  }

  @SubscribeMessage('candidate')
  public onCandidate(client: Socket, [peerId, candidate]) {
    // Either end can generate candidates.
    // When we receive one, pass it on to the peer but reverse the `peerId` property so they know where it's from
    this.logger.verbose(`Candidate for ${client.id}->${peerId}: ${candidate}`);
    this.logger.verbose(JSON.stringify(Array.prototype.slice.call(arguments,1)));
    this.server.to(peerId).emit('candidate', client.id, candidate);
  }


  @SubscribeMessage('disconnect')
  public handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
    this.server.to(this.broadcaster).emit('disconnectPeer', client.id);
  }
}
