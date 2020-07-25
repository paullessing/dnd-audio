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

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AppGateway');

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('broadcaster')
  public onBroadcaster(@ConnectedSocket() socket: Socket): void {
    this.broadcaster = socket.id;
    socket.broadcast.emit('broadcaster');
  }

  @SubscribeMessage('watcher')
  public onWatcher(@ConnectedSocket() socket: Socket): void {
    this.server.to(this.broadcaster).emit('watcher', socket.id);
  }

  @SubscribeMessage('disconnect')
  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.server.to(this.broadcaster).emit('disconnectPeer', client.id);
  }

  @SubscribeMessage('offer')
  public onOffer(@MessageBody() { id, message }: any, @ConnectedSocket() socket: Socket) {
    this.server.to(id).emit("offer", { id: socket.id, message });
  }

  @SubscribeMessage('answer')
  public onAnswer(@MessageBody() { id, message }: any, @ConnectedSocket() socket: Socket) {
    this.server.to(id).emit('answer', { id: socket.id, message });
  }

  @SubscribeMessage('candidate')
  public onCandidate(@MessageBody() { id, message }: any, @ConnectedSocket() socket: Socket) {
    this.server.to(id).emit('candidate', { id: socket.id, message });
  }
}
