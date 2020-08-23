import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RtcListenerPeer } from '../rtc-listener-peer';
import { RtcPeerFactory } from '../rtc-peer-factory.service';

@Component({
  selector: 'dnd-audio-listener-page',
  template: `<dnd-audio-visualizer *ngIf="analyserNode" [analyserNode]="analyserNode"></dnd-audio-visualizer><br>
  <dnd-audio-volume-control [gain]="gainNode" volume="0"></dnd-audio-volume-control>
  `,
})
export class ListenerPageComponent implements OnInit, OnDestroy {

  @ViewChild('canvas')
  public canvasRef: ElementRef;

  public analyserNode: AnalyserNode;
  public gainNode: GainNode;

  private peer: RtcListenerPeer;

  constructor(
    private rtcPeerFactory: RtcPeerFactory,
  ) {
  }

  public ngOnInit(): void {
    const audio = new AudioContext();

    this.analyserNode = audio.createAnalyser();
    this.gainNode = audio.createGain();

    this.analyserNode.connect(this.gainNode).connect(audio.destination);

    this.peer = this.rtcPeerFactory.createListener();
    this.peer.init();
    this.peer.track$.subscribe((e) => {

      e.streams.forEach((stream) => {
        console.log('Listener page: Connected a track');

        this.initialiseStream(stream);

        const src = audio.createMediaStreamSource(stream);
        src.connect(this.analyserNode);
      });
    });
  }

  public ngOnDestroy(): void {
    this.peer.destroy();
  }

  /**
   * Initialise a muted Audio element to trigger the page pulling the source data.
   * Without this, the AudioContext stays silent
   * @see https://stackoverflow.com/a/55644983
   */
  private initialiseStream(stream: MediaStream): void {
    let audio = new Audio();
    audio.muted = true;
    audio.srcObject = stream;
    audio.addEventListener('canplaythrough', () => {
      audio = null;
    });
  }
}
