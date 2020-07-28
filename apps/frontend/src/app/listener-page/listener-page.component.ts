import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RtcListenerPeer } from '../rtc-listener-peer';
import { RtcPeerFactory } from '../rtc-peer-factory.service';

@Component({
  selector: 'dnd-audio-listener-page',
  template: `<dnd-audio-visualizer *ngIf="analyserNode" [analyserNode]="analyserNode"></dnd-audio-visualizer><br>
  <button>I am playing, promise</button><br>
  <input #volumeElt type="range" min="0" max="200" value="100" step="1" (input)="setVolume(volumeElt.value)"> {{ volume }}`,
})
export class ListenerPageComponent implements OnInit, OnDestroy {

  @ViewChild('canvas')
  public canvasRef: ElementRef;

  public analyserNode: AnalyserNode;

  public volume = 100;

  private gainNode: GainNode;

  private peer: RtcListenerPeer;

  constructor(
    private rtcPeerFactory: RtcPeerFactory,
  ) {
  }

  public ngOnInit(): void {
    const audio = new AudioContext();

    this.analyserNode = audio.createAnalyser();
    this.gainNode = audio.createGain();
    this.setVolume(100);

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

  public setVolume(volume: number | string): void {
    this.volume = +volume;
    const gain = this.volume / 100;
    // For volume changing, gain can go from 0 (silent) to 1 (normal) or 2 (louder).
    // If gain is negative, it will invert the frequency values.
    this.gainNode.gain.value = gain;
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
