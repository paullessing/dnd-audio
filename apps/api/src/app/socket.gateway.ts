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
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private broadcaster: string;

  @WebSocketServer()
  private server: Server;

  private logger: Logger = new Logger('SocketGateway');

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('broadcaster')
  public onBroadcaster(@ConnectedSocket() socket: Socket): void {
    this.broadcaster = socket.id;
    this.logger.log(`new broadcaster ${this.broadcaster}`);
    socket.broadcast.emit('broadcaster');
    socket.emit('ack', socket.id);
  }

  @SubscribeMessage('watcher')
  public onWatcher(@ConnectedSocket() socket: Socket): void {
    this.logger.log(`New watcher ${JSON.stringify([this.broadcaster, socket.id])}`);
    this.server.to(this.broadcaster).emit('watcher', socket.id);
  }

  @SubscribeMessage('disconnect')
  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.server.to(this.broadcaster).emit('disconnectPeer', client.id);
  }

  @SubscribeMessage('offer')
  public onOffer(@MessageBody() { id, message }: any, @ConnectedSocket() socket: Socket) {
    this.logger.log(`offer: ${JSON.stringify([id, { id: socket.id, message }])}`);
    this.server.to(id).emit("offer", { id: socket.id, message });
  }

  @SubscribeMessage('answer')
  public onAnswer(@MessageBody() { id, message }: any, @ConnectedSocket() socket: Socket) {
    this.logger.log(`answer: ${JSON.stringify([id, { id: socket.id, message }])}`);
    this.server.to(id).emit('answer', { id: socket.id, message });
  }

  @SubscribeMessage('candidate')
  public onCandidate(@MessageBody() { id, message }: any, @ConnectedSocket() socket: Socket) {
    this.logger.log(`candidate: ${JSON.stringify([id, { id: socket.id, message }])}`);
    this.server.to(id).emit('candidate', { id: socket.id, message });
  }
}
