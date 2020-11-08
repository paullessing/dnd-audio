import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MediaCollection } from '@dnd-audio/api-interfaces';
import { Observable } from 'rxjs';
import { RtcBroadcasterPeer } from '../rtc-broadcaster-peer';
import { RtcPeerFactory } from '../rtc-peer-factory.service';

@Component({
  selector: 'dnd-audio-stream-page',
  template: `Listeners: {{ this.peer ? this.peer.listenerCount : 0 }}<br>
  <ng-container *ngIf="accepted; else button">
    <dnd-audio-volume-control [gain]="gainNode" volume="100"></dnd-audio-volume-control><br>
    <button (click)="togglePlay()">{{ isPlaying ? 'Pause' : 'Play' }}</button>
    <ul *ngIf="(media$ | async) as media">
      <li *ngFor="let track of media.tracks">
        <div (click)="playTrack(track.filename)">
          <img
            *ngIf="(track.metadata.common.picture ||[])[0]; let picture"
            [src]="'data:' + picture.format + ';base64,' + picture.data"
            width="50" height="50"
          />
          {{ track.metadata.common.artist }} - {{ track.metadata.common.title }}
        </div>
      </li>
    </ul>
    <button (click)="shareLocalAudio()">Share local audio</button>
  </ng-container>
  <ng-template #button>
    <button (click)="accept()">Start</button>
  </ng-template>
  `,
})
export class StreamPageComponent implements OnInit, OnDestroy {

  public status: string;
  public accepted: boolean;

  @ViewChild('video')
  public videoEl: ElementRef<HTMLVideoElement>;

  public media$: Observable<MediaCollection>;

  public isPlaying = false;

  public peer: RtcBroadcasterPeer;
  public gainNode: GainNode;

  private audio: HTMLAudioElement;
  private track: MediaElementAudioSourceNode;
  private stream: MediaStream;
  private context: AudioContext;
  private destination: MediaStreamAudioDestinationNode;

  constructor(
    private rtcPeerFactory: RtcPeerFactory,
    private http: HttpClient
  ) {
    this.status = 'NONE';
  }

  public ngOnInit(): void {
    this.media$ = this.http.get<MediaCollection>('/api/media/list');
  }

  public ngOnDestroy(): void {
    if (this.peer) {
      this.peer.destroy();
    }
  }

  public accept(): void {
    this.setupAudio();
    this.accepted = true;
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

  public async shareLocalAudio(): Promise<void> {
    const audio: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({ audio : true, video: true });

    const audioStream = new MediaStream(audio.getAudioTracks());

    this.context.createMediaStreamSource(audioStream).connect(this.destination);
  }

  private setupAudio(): void {
    if (this.context) {
      return;
    }

    this.context = new AudioContext();

    this.audio = new Audio();
    const track = this.context.createMediaElementSource(this.audio);
    this.destination = this.context.createMediaStreamDestination();

    this.gainNode = this.context.createGain();

    track.connect(this.gainNode).connect(this.destination);

    this.peer = this.rtcPeerFactory.createBroadcaster();
    this.peer.init(this.destination.stream);
  }
}
