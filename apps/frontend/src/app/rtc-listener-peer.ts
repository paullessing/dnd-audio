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
  ) {
    this.setupPeerConnection = this.setupPeerConnection.bind(this);
    this.onTrack = this.onTrack.bind(this);
    this.onCandidate = this.onCandidate.bind(this);
    this.closePeerConnection = this.closePeerConnection.bind(this);
  }

  public get track$(): Observable<RTCTrackEvent> {
    return this.trackSubject.asObservable();
  }

  private trackSubject: Subject<RTCTrackEvent> = new Subject();

  public init(): void {
    // Based on https://gabrieltanner.org/blog/webrtc-video-broadcast
    this.zone.runOutsideAngular(() => {
      this.socket.on('offerFromBroadcaster', this.setupPeerConnection);

      this.socket.on('candidate', this.onCandidate);

      this.socket.on('broadcastDisconnected', this.closePeerConnection);

      // Initialise this client by announcing it as a listener
      this.socket.emit('listener');

      // Emit when the broadcaster changes
      this.socket.on('broadcaster', (broadcasterId) => {
        this.closePeerConnection();

        console.log('New broadcaster announced, declaring self as a listener');
        this.socket.emit('listener');
      });
    })
  }

  public destroy(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.socket.emit('disconnect');
    this.socket.disconnect();
  }

  private async setupPeerConnection(broadcasterId: string, description: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.createPeerConnection();

    // 7. The recipient receives the offer and calls RTCPeerConnection.setRemoteDescription() to record it as the remote description
    await peerConnection.setRemoteDescription(description)

    // 8. The recipient does any setup it needs to do for its end of the call (none because we're only listening)
    // 9. The recipient then creates an answer by calling RTCPeerConnection.createAnswer().
    const sessionDescription = await peerConnection.createAnswer();

    // 10. The recipient calls RTCPeerConnection.setLocalDescription(), passing in the created answer, to set the answer as its local description.
    //     The recipient now knows the configuration of both ends of the connection.
    await peerConnection.setLocalDescription(sessionDescription);

    // 11. The recipient uses the signaling server to send the answer to the caller.
    console.log('Responding to broadcast', broadcasterId);
    this.socket.emit('answerToBroadcaster', broadcasterId, peerConnection.localDescription);
    console.log('Initialised connection to broadcast', broadcasterId);

    peerConnection.onicecandidate = ({ candidate }: RTCPeerConnectionIceEvent) => {
      if (candidate) {
        this.socket.emit('candidate', broadcasterId, candidate);
      }
    };
  }

  private createPeerConnection(): RTCPeerConnection {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.peerConnection = new RTCPeerConnection(this.config);
    this.peerConnection.ontrack = this.onTrack;

    return this.peerConnection;
  }

  private onCandidate(broadcasterId: string, candidate: RTCIceCandidate): void {
    if (!this.peerConnection) {
      return;
    }

    this.peerConnection
      .addIceCandidate(new RTCIceCandidate(candidate))
      .catch(e => console.error(e));
  }

  private onTrack(event: RTCTrackEvent): void {
    this.zone.run(() => {
      console.log('Got a track');
      this.trackSubject.next(event);
    });
  }

  private closePeerConnection(): void {
    if (!this.peerConnection) {
      return;
    }
    this.peerConnection.close();
    this.peerConnection = null;
  }
}
