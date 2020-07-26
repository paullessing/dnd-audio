import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MediaCollection } from '@dnd-audio/api-interfaces';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { RtcBroadcasterPeer } from '../rtc-broadcaster-peer';
import { RtcPeerFactory } from '../rtc-peer-factory.service';

@Component({
  selector: 'dnd-audio-stream-page',
  template: `Status: {{ status }}<br>
  <button *ngIf="status === 'CONNECTED'" (click)="getStream()">Get Stream</button><br>
  <video #video></video>
  <ul *ngIf="(media$ | async) as media">
    <li *ngFor="let track of media.tracks">{{ track.filename }} <button (click)="play(track.filename)">Play</button></li>
  </ul>`,
})
export class StreamPageComponent implements OnInit, OnDestroy {

  public status: string;

  @ViewChild('video')
  public videoEl: ElementRef<HTMLVideoElement>;

  public media$: Observable<MediaCollection>;

  private socket: Socket;
  private peer: RtcBroadcasterPeer;

  private audio: HTMLAudioElement;

  constructor(
    private rtcPeerFactory: RtcPeerFactory,
    private http: HttpClient
  ) {
    this.socket = new Socket({ url: 'http://localhost:3333', });
    this.status = 'NONE';
  }

  public ngOnInit(): void {
    this.socket.on('connect', () => {
      this.status = 'CONNECTED';
    });

    this.media$ = this.http.get<MediaCollection>('/api/media/list');
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

  public play(track: string): void {
    const fileUrl = '/api/media/stream/' + track;
    if (this.audio && this.audio.src === fileUrl) {
      return;
    }
    if (this.audio) {
      this.audio.pause();
    }
    this.audio = new Audio(fileUrl);
    this.audio.play();
    const stream = (this.audio as any).captureStream();
    this.audio.muted = true;

    if (this.peer) {
      this.peer.destroy();
    }

    // TODO creating new peers messes up the listeners;
    // this might not be a problem if we're not creating new peers.
    // But if we want to be able to restart the broadcaster, we need to address that.
    this.peer = this.rtcPeerFactory.createBroadcaster();
    this.peer.init(stream);
  }
}
