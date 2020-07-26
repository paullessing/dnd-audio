import { NgZone } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, Subject } from 'rxjs';

export class RtcListenerPeer {
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

  private peerConnection: RTCPeerConnection;

  constructor(
    private socket: Socket,
    private zone: NgZone,
    private config: RTCConfiguration,
  ) {}

  public get track$(): Observable<RTCTrackEvent> {
    return this.trackSubject.asObservable();
  }

  private trackSubject: Subject<RTCTrackEvent> = new Subject();

  public init(): void {
    // Based on https://gabrieltanner.org/blog/webrtc-video-broadcast
    this.zone.runOutsideAngular(() => {
      this.socket.on('offer', ({ id: remoteId, description }) => {
        this.peerConnection = this.setupPeerConnection(remoteId, description);
      });

      this.socket.on('candidate', ({ candidate }) => {
        this.peerConnection
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch(e => console.error(e));
      });

      // Initialise this client by announcing it as a watcher
      this.socket.emit('watcher');

      // Emit on socket start
      this.socket.on('connect', () => {
        console.log('Emitting watch on connect');
        this.socket.emit('watcher');
      });

      // Emit when the broadcaster changes
      this.socket.on('broadcaster', () => {
        console.log('Emitting watch on broadcast');
        this.socket.emit('watcher');
      });
    })
  }

  private setupPeerConnection(broadcasterId: string, description: RTCSessionDescriptionInit): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection(this.config);
    // 7. The recipient receives the offer and calls RTCPeerConnection.setRemoteDescription() to record it as the remote description
    peerConnection
      .setRemoteDescription(description)
      // 8. The recipient does any setup it needs to do for its end of the call (none because we're only listening)
      // 9. The recipient then creates an answer by calling RTCPeerConnection.createAnswer().
      .then(() => peerConnection.createAnswer())
      // 10. The recipient calls RTCPeerConnection.setLocalDescription(), passing in the created answer, to set the answer as its local description.
      //      The recipient now knows the configuration of both ends of the connection.
      .then(sdp => peerConnection.setLocalDescription(sdp))
      .then(() => {
        // 11. The recipient uses the signaling server to send the answer to the caller.
        this.socket.emit('answer', { id: broadcasterId, description: peerConnection.localDescription });
        console.log('Initialised connection to broadcast', broadcasterId);
      });

    // Connection has been initialised, we've received a track
    peerConnection.ontrack = (event) => {
      this.zone.run(() => {
        console.log('Got a track');
        this.trackSubject.next(event);
      });
    };

    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.socket.emit('candidate', { peerId: broadcasterId, candidate });
      }
    };

    return peerConnection;
  }

  public destroy(): void {
    this.peerConnection.close();
    this.socket.emit('disconnect');
    this.socket.disconnect();
  }
}
