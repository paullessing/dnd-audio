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

  constructor(
    private socket: Socket,
  ) {
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
          urls: ["stun:stun.l.google.com:19302"]
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

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((_stream) => {
        stream = _stream;
        this.videoEl.nativeElement.srcObject = stream;
        this.videoEl.nativeElement.play();
        this.socket.emit('broadcaster');

        this.socket.on("watcher", (id) => {
          console.log('New watcher', id);
          const peerConnection = new RTCPeerConnection(config);
          peerConnections[id] = peerConnection;

          stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

          peerConnection.onicecandidate = event => {
            if (event.candidate) {
              this.socket.emit("candidate", { id, message: event.candidate });
            }
          };

          peerConnection
            .createOffer()
            .then(sdp => peerConnection.setLocalDescription(sdp))
            .then(() => {
              this.socket.emit("offer", { id, message: peerConnection.localDescription });
            });
        });

        this.socket.on("answer", ({ id, message: description }) => {
          peerConnections[id].setRemoteDescription(description);
        });

        this.socket.on("candidate", ({ id, message: candidate }) => {
          peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
        });

        this.socket.on("disconnectPeer", id => {
          peerConnections[id].close();
          delete peerConnections[id];
        });
      })
      .catch(error => console.error(error));
  }

}
