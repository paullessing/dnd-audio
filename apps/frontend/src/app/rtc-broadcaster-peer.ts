import { NgZone } from '@angular/core';
import { Socket } from 'ngx-socket-io';

export class RtcBroadcasterPeer {
  /*
   1. The caller captures local Media via navigator.mediaDevices.getUserMedia()
   2. The caller creates RTCPeerConnection and called RTCPeerConnection.addTrack() (Since addStream is deprecating)
   3. The caller calls RTCPeerConnection.createOffer() to create an offer.
   4. The caller calls RTCPeerConnection.setLocalDescription() to set that offer as the local description (that is, the description of the local end of the connection).
   5. After setLocalDescription(), the caller asks STUN servers to generate the ice candidates
   6. The caller uses the signaling server to transmit the offer to the intended receiver of the call.
   7. The recipient receives the offer and calls RTCPeerConnection.setRemoteDescription() to record it as the remote description (the description of the other end of the connection).
   8. The recipient does any setup it needs to do for its end of the call: capture its local media, and attach each media tracks into the peer connection via RTCPeerConnection.addTrack()
   9. The recipient then creates an answer by calling RTCPeerConnection.createAnswer().
  10. The recipient calls RTCPeerConnection.setLocalDescription(), passing in the created answer, to set the answer as its local description. The recipient now knows the configuration of both ends of the connection.
  11. The recipient uses the signaling server to send the answer to the caller.
  12. The caller receives the answer.
  13. The caller calls RTCPeerConnection.setRemoteDescription() to set the answer as the remote description for its end of the call. It now knows the configuration of both peers. Media begins to flow as configured.
   */

  public get listenerCount(): number {
    return this.peerConnections.size;
  }

  private stream: MediaStream;
  private peerConnections: Map<string, RTCPeerConnection>;

  constructor(
    private socket: Socket,
    private zone: NgZone,
    private config: RTCConfiguration,
  ) {
    this.peerConnections = new Map();

    this.addIceCandidate = this.addIceCandidate.bind(this);
    this.addListener = this.addListener.bind(this);
    this.processAnswer = this.processAnswer.bind(this);
    this.removeDisconnectedPeer = this.removeDisconnectedPeer.bind(this);
  }

  public init(stream: MediaStream): void {
    this.zone.runOutsideAngular(() => {
      this.stream = stream;
      this.socket.emit('broadcaster'); // Register self as the only broadcaster

      this.socket.on('listener', this.addListener);
      // 12. The caller receives the answer.
      this.socket.on('answerFromListener', this.processAnswer);
      this.socket.on('candidate', this.addIceCandidate);
      this.socket.on('disconnectPeer', this.removeDisconnectedPeer);
    });
  }

  public destroy(): void {
    for (const peerConnection of this.peerConnections.values()) {
      peerConnection.close();
    }

    this.socket.disconnect();
  }

  private addIceCandidate(listenerId: string, candidate: RTCIceCandidate): void {
    if (!this.peerConnections.has(listenerId)) {
      return;
    }
    this.peerConnections.get(listenerId).addIceCandidate(new RTCIceCandidate(candidate));
  }

  private async addListener(listenerId: string) {
    console.info('New listener', listenerId);

    if (this.peerConnections.has(listenerId)) {
      return;
      // this.peerConnections.get(listenerId).connection.close();
    }

    // 2. The caller creates RTCPeerConnection and called RTCPeerConnection.addTrack()
    const peerConnection = new RTCPeerConnection(this.config);
    this.peerConnections.set(listenerId, peerConnection);

    this.stream.getTracks().forEach((track) => {
      console.log('Adding track');
      peerConnection.addTrack(track, this.stream);
    });

    // 3. The caller calls RTCPeerConnection.createOffer() to create an offer.
    const sessionDescription = await peerConnection.createOffer();

    // 4. The caller calls RTCPeerConnection.setLocalDescription() to set that offer as the local description
    await peerConnection.setLocalDescription(sessionDescription);

    // 5. After setLocalDescription(), the caller asks STUN servers to generate the ice candidates
    peerConnection.onicecandidate = ({ candidate }: RTCPeerConnectionIceEvent) => {
      if (candidate) {
        // console.info('Candidate', listenerId, candidate);
        this.socket.emit('candidate', listenerId, candidate);
      }
    };

    // 6. The caller uses the signaling server to transmit the offer to the intended receiver of the call.
    this.socket.emit('offerToListener', listenerId, peerConnection.localDescription);
  }

  private processAnswer(listenerId, description): void {
    if (!this.peerConnections.has(listenerId)) {
      return;
    }

    // 13. The caller calls RTCPeerConnection.setRemoteDescription() to set the answer as the remote description for its end of the call.
    //      It now knows the configuration of both peers.
    //      Media begins to flow as configured.
    const peerConnection = this.peerConnections.get(listenerId);
    peerConnection.setRemoteDescription(description);
    console.info('Initialised peer connection', listenerId);
  }

  private removeDisconnectedPeer(peerId: string): void {
    if (this.peerConnections.has(peerId)) {
      this.peerConnections.get(peerId).close();
      this.peerConnections.delete(peerId);
    }
  }
}
