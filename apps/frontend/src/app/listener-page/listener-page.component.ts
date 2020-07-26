import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { RtcPeerFactory } from '../rtc-peer-factory.service';
import { RtcPeer } from '../rtc-peer.service';

@Component({
  selector: 'dnd-audio-listener-page',
  template: `Connection ID: {{ id }}<br><button (click)="connect()">Connect</button><br><video #video></video>`,
})
export class ListenerPageComponent implements OnInit {

  public id: string;

  @ViewChild('video')
  public videoEl: ElementRef<HTMLVideoElement>;

  constructor(
    private rtcPeerFactory: RtcPeerFactory
  ) {
    this.id = '';
  }

  public ngOnInit(): void {
    // Based on https://gabrieltanner.org/blog/webrtc-video-broadcast

    const peer = this.rtcPeerFactory.createListener();
    peer.init();
    peer.track$.subscribe((e) => {
      this.videoEl.nativeElement.srcObject = e.streams[0];
      this.videoEl.nativeElement.play();
    });

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
  }
}
