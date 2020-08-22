import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class BroadcastConnectGateway implements OnGatewayConnection, OnGatewayDisconnect {

  private broadcaster: string | null;

  @WebSocketServer()
  private server: Server;

  private logger: Logger = new Logger('BroadcastConnectGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('disconnect')
  public handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
    if (this.broadcaster === client.id) {
      client.broadcast.emit('broadcastDisconnected', client.id);
      this.broadcaster = null;
    } else {
      this.server.to(this.broadcaster).emit('disconnectPeer', client.id);
    }
  }

  @SubscribeMessage('broadcaster')
  public onBroadcaster(@ConnectedSocket() client: Socket): void {
    this.broadcaster = client.id;
    this.logger.debug(`New broadcaster: ${this.broadcaster}`);
    client.broadcast.emit('broadcaster', client.id);
  }

  @SubscribeMessage('listener')
  public onListener(@ConnectedSocket() client: Socket): void {
    this.logger.debug(`New listener: ${JSON.stringify([this.broadcaster, client.id])}`);
    if (this.broadcaster) {
      this.server.to(this.broadcaster).emit('listener', client.id);
    }
  }

  @SubscribeMessage('offerToListener')
  public onOffer(broadcaster: Socket, [listenerId, description]: [string, RTCSessionDescription]) {
    this.logger.debug(`Broadcaster ${broadcaster.id} made an offer to listener ${listenerId}`);
    this.logger.verbose(JSON.stringify(description));
    this.server.to(listenerId).emit('offerFromBroadcaster', broadcaster.id, description);
  }

  @SubscribeMessage('answerToBroadcaster')
  public onAnswer(client: Socket, [broadcasterId, description]: [string, RTCSessionDescription]) {
    this.logger.verbose(`Answer from listener ${client.id} to broadcaster ${broadcasterId}`);
    this.logger.verbose(JSON.stringify(description));
    this.server.to(broadcasterId).emit('answerFromListener', client.id, description);
  }

  @SubscribeMessage('candidate')
  public onCandidate(client: Socket, [peerId, candidate]: [string, RTCIceCandidate]) {
    // Either end can generate candidates.
    // When we receive one, pass it on to the peer but reverse the `peerId` property so they know where it's from
    this.logger.debug(`Candidate for ${client.id}->${peerId}`);
    this.logger.verbose(JSON.stringify(candidate));
    this.logger.verbose(JSON.stringify(Array.prototype.slice.call(arguments,1)));
    this.server.to(peerId).emit('candidate', client.id, candidate);
  }
}
