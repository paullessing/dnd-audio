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

  private stream: MediaStream;
  private peerConnections: Map<string, RTCPeerConnection>;

  constructor(
    private socket: Socket,
    private config: RTCConfiguration,
  ) {
    this.peerConnections = new Map();
  }

  public init(stream: MediaStream): void {
    this.stream = stream;
    this.socket.emit('broadcaster'); // Register self as the only broadcaster

    this.socket.on('watcher', (watcherId) => this.addWatcher(watcherId));

    this.socket.on('answer', ({ id, description }) => {
      // 12. The caller receives the answer.
      // 13. The caller calls RTCPeerConnection.setRemoteDescription() to set the answer as the remote description for its end of the call.
      //      It now knows the configuration of both peers.
      //      Media begins to flow as configured.
      this.peerConnections.get(id).setRemoteDescription(description);
    });

    this.socket.on('candidate', ({ peerId, candidate }) => {
      this.peerConnections.get(peerId).addIceCandidate(new RTCIceCandidate(candidate));
    });

    this.socket.on('disconnectPeer', (peerId) => {
      this.peerConnections[peerId].close();
      this.peerConnections.delete(peerId);
    });
  }

  private addWatcher(watcherId: string) {
    console.log('New watcher', watcherId);

    // 2. The caller creates RTCPeerConnection and called RTCPeerConnection.addTrack()
    const peerConnection = new RTCPeerConnection(this.config);
    this.peerConnections.set(watcherId, peerConnection);

    this.stream.getTracks().forEach(track => peerConnection.addTrack(track, this.stream));

    // 5. After setLocalDescription(), the caller asks STUN servers to generate the ice candidates
    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.socket.emit('candidate', { peerId: watcherId, candidate });
      }
    };

    // 3. The caller calls RTCPeerConnection.createOffer() to create an offer.
    peerConnection
      .createOffer()
      // 4. The caller calls RTCPeerConnection.setLocalDescription() to set that offer as the local description
      .then(sdp => peerConnection.setLocalDescription(sdp))
      // 5. See above, configured as a callback
      .then(() => {
        // 6. The caller uses the signaling server to transmit the offer to the intended receiver of the call.
        this.socket.emit('offer', { id: watcherId, description: peerConnection.localDescription });
      });
  }

  public destroy(): void {
    for (const connection of this.peerConnections.values()) {
      connection.close();
    }

    this.socket.emit('disconnect');
    this.socket.disconnect();
  }
}
