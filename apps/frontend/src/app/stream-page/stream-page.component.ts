import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MediaCollection } from '@dnd-audio/api-interfaces';
import { Observable } from 'rxjs';
import { RtcBroadcasterPeer } from '../rtc-broadcaster-peer';
import { RtcPeerFactory } from '../rtc-peer-factory.service';

@Component({
  selector: 'dnd-audio-stream-page',
  template: `Status: {{ status }}<br>
  <ul *ngIf="(media$ | async) as media">
    <li *ngFor="let track of media.tracks">{{ track.filename }} <button (click)="play(track.filename)">Play</button></li>
  </ul>`,
})
export class StreamPageComponent implements OnInit, OnDestroy {

  public status: string;

  @ViewChild('video')
  public videoEl: ElementRef<HTMLVideoElement>;

  public media$: Observable<MediaCollection>;

  private peer: RtcBroadcasterPeer;

  private audio: HTMLAudioElement;
  private track: MediaElementAudioSourceNode;
  private stream: MediaStream;
  private context: AudioContext;

  constructor(
    private rtcPeerFactory: RtcPeerFactory,
    private http: HttpClient
  ) {
    this.status = 'NONE';
  }

  public ngOnInit(): void {
    this.media$ = this.http.get<MediaCollection>('/api/media/list');
  }

  private setupAudio(): void {
    if (this.context) {
      return;
    }

    this.context = new AudioContext();

    this.audio = new Audio();
    // // this.audio.muted = true;
    const track = this.context.createMediaElementSource(this.audio);
    const streamDest = this.context.createMediaStreamDestination();

    track.connect(streamDest);

    this.peer = this.rtcPeerFactory.createBroadcaster();
    this.peer.init(streamDest.stream);

    // const a = new Audio();
    // a.srcObject = streamDest.stream;
    // a.play();
  }

  public ngOnDestroy(): void {
    if (this.peer) {
      this.peer.destroy();
    }
  }

  public play(track: string): void {
    this.setupAudio();

    const fileUrl = '/api/media/stream/' + track;
    if (this.audio && this.audio.src === fileUrl) {
      return;
    }
    if (this.audio) {
      this.audio.pause();
    }
    this.audio.src = fileUrl;
    // this.audio = new Audio(fileUrl);
    this.audio.play();
    // const stream = (this.audio as any).captureStream();
    //
    // // TODO creating new peers messes up the listeners;
    // // this might not be a problem if we're not creating new peers.
    // // But if we want to be able to restart the broadcaster, we need to address that.
    // this.peer = this.rtcPeerFactory.createBroadcaster();
    // this.peer.init(stream);
  }
}
