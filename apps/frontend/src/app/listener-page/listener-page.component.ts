import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'dnd-audio-listener-page',
  template: `Connection ID: {{ id }}<br><button (click)="connect()">Connect</button><br><video #video></video>`,
})
export class ListenerPageComponent implements OnInit {

  public id: string;

  @ViewChild('video')
  public videoEl: ElementRef<HTMLVideoElement>;

  constructor(
    private socket: Socket,
  ) {
    this.id = '';
  }

  public ngOnInit(): void {
    // Based on https://gabrieltanner.org/blog/webrtc-video-broadcast


  //   console.log('Initialising');
  //   const peer = this.peers.create();
  //   console.log('peer', peer);
  //
  //   peer.on('open', (id) => {
  //     this.id = id;
  //   });
  //
  //   peer.on('error', (err) => {
  //     console.log('Peer error', err);
  //   });
  //
  //   console.log('Connecting');
  //   const conn = peer.connect('dnd-audio-server');
  //   conn.on('open', () => {
  //     console.log('Connection is open');
  //   });
  //   conn.on('error', (err) => {
  //     console.log('Conn error', err);
  //   });
  //   peer.on('call', (call) => {
  //     console.log('Getting a call');
  //
  //     call.answer();
  //     call.on('stream', (mediaStream: MediaStream) => {
  //       console.log('Got a stream');
  //       this.videoEl.nativeElement.srcObject = mediaStream;
  //     });
  //   })
  // }
  //
  // public connect(): void {
  //   const getUserMedia: typeof navigator.getUserMedia =
  //     (navigator as any).getUserMedia ||
  //     (navigator as any).webkitGetUserMedia ||
  //     (navigator as any).mozGetUserMedia;
  //
  //   getUserMedia({video: true}, (stream) => {
  //     const call = this.peer.call('another-peers-id', stream);
  //   }, (err) => {
  //     console.log('Failed to get local stream', err);
  //   });

  }

  public connect(): void {
    // TODO wrap all this logic in a service

    let peerConnection;
    const config = {
      iceServers: [
        {
          urls: ["stun:stun.l.google.com:19302"]
        }
      ]
    };

    this.socket.on("offer", ({ id, message: description }) => {
      peerConnection = new RTCPeerConnection(config);
      peerConnection
        .setRemoteDescription(description)
        .then(() => peerConnection.createAnswer())
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
          this.socket.emit("answer", { id, message: peerConnection.localDescription });
        });
      peerConnection.ontrack = (event) => {
        console.log('Got a track');
        this.videoEl.nativeElement.srcObject = event.streams[0];
        this.videoEl.nativeElement.play();
      };
      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          this.socket.emit("candidate", { id, message: event.candidate });
        }
      };
    });

    this.socket.on("candidate", ({ message: candidate }) => {
      peerConnection
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch(e => console.error(e));
    });

    this.socket.emit('watcher');

    this.socket.on("connect", () => {
      this.id = 'connected'
      this.socket.emit("watcher");
    });

    this.socket.on("broadcaster", () => {
      this.socket.emit("watcher");
    });

    this.socket.on("disconnectPeer", () => {
      peerConnection.close();
    });
  }
}
