import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MediaCollection } from '@dnd-audio/api-interfaces';
import { Observable } from 'rxjs';
import { RtcBroadcasterPeer } from '../rtc-broadcaster-peer';
import { RtcPeerFactory } from '../rtc-peer-factory.service';

@Component({
  selector: 'dnd-audio-stream-page',
  template: `Listeners: {{ this.peer ? (this.peer.listeners$ | async) : 0 }}<br>
  <button (click)="togglePlay()">{{ isPlaying ? 'Pause' : 'Play' }}</button>
  <ul *ngIf="(media$ | async) as media">
    <li *ngFor="let track of media.tracks"><div (click)="playTrack(track.filename)">
      <img *ngIf="(track.metadata.common.picture ||[])[0]; let picture" [src]="'data:' + picture.format + ';base64,' + picture.data" width="50" height="50"/>
      {{ track.metadata.common.artist }} - {{ track.metadata.common.title }}
    </div></li>
  </ul>`,
})
export class StreamPageComponent implements OnInit, OnDestroy {

  public status: string;

  @ViewChild('video')
  public videoEl: ElementRef<HTMLVideoElement>;

  public media$: Observable<MediaCollection>;

  public isPlaying = false;

  public peer: RtcBroadcasterPeer;
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

    this.setupAudio();
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

  public playTrack(track: string): void {
    // this.setupAudio();

    const fileUrl = '/api/media/stream/' + track;
    if (this.audio && this.audio.src === fileUrl) {
      return;
    }
    this.audio.src = fileUrl;
    this.togglePlay(true);
  }

  public togglePlay(play: boolean = !this.isPlaying): void {
    if (!this.audio) {
      return;
    }

    if (play) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
    this.isPlaying = play;
  }
}
