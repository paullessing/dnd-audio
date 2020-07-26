import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'dnd-audio-stream-page',
  template: `Status: {{ status }}<br>
  <button *ngIf="status === 'CONNECTED'" (click)="go()">Get Stream</button><br>
  <video #video></video>`,
})
export class StreamPageComponent implements OnInit {

  public status: string;

  @ViewChild('video')
  public videoEl: ElementRef<HTMLVideoElement>;

  private stream: Promise<MediaStream>;
  private resolve: any;

  private socket: Socket;

  constructor(
  ) {
    this.socket = new Socket({ url: 'http://localhost:3333', });
    this.status = 'NONE';

    this.stream = new Promise((resolve) => this.resolve = resolve);
  }

  public ngOnInit(): void {
    this.socket.on('connect', () => {
      this.status = 'CONNECTED';
    });

    // this.socket.fromEvent('ack').subscribe((x) => {
    //   console.log('ack', x);
    // })
    // this.socket.emit('broadcaster');


//     console.log('Initialising');
//     this.peer = this.peers.create('dnd-audio-server');
//     console.log('peer', this.peer);
//
//     this.status = 'CONNECTING';
//
//     this.peer.on('open', () => {
//       this.status = 'CONNECTED';
//     });
//
//     this.peer.on('error', (err) => {
//       console.log('Peer error', err);
//     });
//
//     this.peer.on('connection', async (dataConnection) => {
//       const id = dataConnection.peer;
//       console.log('Got connection from', id);
//
//       const stream = await this.stream;
//       console.log('Calling', id);
//       const call = this.peer.call(id, stream); // Send my media
//       console.log('Called', call);
//
//       dataConnection.close();
//     });
  }

  public go() {
    // TODO wrap all this logic in a service and make it easy to use
    const peerConnections = {};
    const config = {
      iceServers: [
        {
          urls: ['stun:stun.l.google.com:19302']
        }
      ]
    };

    // Media contrains
    const constraints = {
      video: true,
      // Uncomment to enable audio
      // audio: true,
    };

    let stream: MediaStream;

    // 1. The caller captures local Media via navigator.mediaDevices.getUserMedia()
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((_stream) => {
        stream = _stream;
        this.videoEl.nativeElement.srcObject = stream;
        this.videoEl.nativeElement.play();
        this.socket.emit('broadcaster'); // Register self as the only broadcaster

        this.socket.on('watcher', (watcherId) => {
          console.log('New watcher', watcherId);

          // 2. The caller creates RTCPeerConnection and called RTCPeerConnection.addTrack()
          const peerConnection = new RTCPeerConnection(config);
          peerConnections[watcherId] = peerConnection;

          stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

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
        });

        this.socket.on('answer', ({ id, description }) => {
          // 12. The caller receives the answer.
          // 13. The caller calls RTCPeerConnection.setRemoteDescription() to set the answer as the remote description for its end of the call.
          //      It now knows the configuration of both peers.
          //      Media begins to flow as configured.
          peerConnections[id].setRemoteDescription(description);
        });

        this.socket.on('candidate', ({ peerId, candidate }) => {
          peerConnections[peerId].addIceCandidate(new RTCIceCandidate(candidate));
        });

        this.socket.on('disconnectPeer', (peerId) => {
          peerConnections[peerId].close();
          delete peerConnections[peerId];
        });
      })
      .catch(error => console.error(error));
  }

}
