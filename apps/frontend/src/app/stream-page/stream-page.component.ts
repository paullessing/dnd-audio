import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { RtcBroadcasterPeer } from '../rtc-broadcaster-peer';
import { RtcPeerFactory } from '../rtc-peer-factory.service';

@Component({
  selector: 'dnd-audio-stream-page',
  template: `Status: {{ status }}<br>
  <button *ngIf="status === 'CONNECTED'" (click)="getStream()">Get Stream</button><br>
  <video #video></video>`,
})
export class StreamPageComponent implements OnInit, OnDestroy {

  public status: string;

  @ViewChild('video')
  public videoEl: ElementRef<HTMLVideoElement>;

  private socket: Socket;
  private peer: RtcBroadcasterPeer;

  constructor(
    private rtcPeerFactory: RtcPeerFactory
  ) {
    this.socket = new Socket({ url: 'http://localhost:3333', });
    this.status = 'NONE';
  }

  public ngOnInit(): void {
    this.socket.on('connect', () => {
      this.status = 'CONNECTED';
    });
  }

  public ngOnDestroy(): void {
    if (this.peer) {
      this.peer.destroy();
    }
  }

  public getStream(): void {
    // Media contrains
    const constraints = {
      video: true,
      // Uncomment to enable audio
      // audio: true,
    };

    // 1. The caller captures local Media via navigator.mediaDevices.getUserMedia()
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        this.peer = this.rtcPeerFactory.createBroadcaster();
        this.peer.init(stream);

        this.videoEl.nativeElement.srcObject = stream;
        this.videoEl.nativeElement.play();
      })
      .catch(error => console.error(error));
  }
}
