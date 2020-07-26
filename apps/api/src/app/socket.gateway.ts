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
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {

  private broadcaster: string;

  @WebSocketServer()
  private server: Server;

  private logger: Logger = new Logger('SocketGateway');

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log('Client connected', client.id);
  }

  @SubscribeMessage('broadcaster')
  public onBroadcaster(@ConnectedSocket() socket: Socket): void {
    this.broadcaster = socket.id;
    this.logger.debug('New broadcaster', this.broadcaster);
    socket.broadcast.emit('broadcaster');
  }

  @SubscribeMessage('watcher')
  public onWatcher(@ConnectedSocket() socket: Socket): void {
    this.logger.debug('New watcher', JSON.stringify([this.broadcaster, socket.id]));
    this.server.to(this.broadcaster).emit('watcher', socket.id);
  }

  @SubscribeMessage('disconnect')
  public handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.debug('Client disconnected', client.id);
    this.server.to(this.broadcaster).emit('disconnectPeer', client.id);
  }

  @SubscribeMessage('offer')
  public onOffer(@MessageBody() { id, description }: any, @ConnectedSocket() socket: Socket) {
    this.logger.verbose('Offer made', JSON.stringify([id, { id: socket.id, description }]));
    this.server.to(id).emit('offer', { id: socket.id, description });
  }

  @SubscribeMessage('answer')
  public onAnswer(@MessageBody() { id, description }: any, @ConnectedSocket() socket: Socket) {
    this.logger.verbose('Answer', JSON.stringify([id, { id: socket.id, description }]));
    this.server.to(id).emit('answer', { id: socket.id, description });
  }

  @SubscribeMessage('candidate')
  public onCandidate(@MessageBody() { peerId, candidate }: any, @ConnectedSocket() socket: Socket) {
    // Either end can generate candidates.
    // When we receive one, pass it on to the peer but reverse the `peerId` property so they know where it's from
    this.logger.verbose('Candidate', JSON.stringify([socket.id, { peerId, candidate }]));
    this.server.to(peerId).emit('candidate', { peerId: socket.id, candidate });
  }
}
