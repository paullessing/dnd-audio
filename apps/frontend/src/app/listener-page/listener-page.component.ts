import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RtcListenerPeer } from '../rtc-listener-peer';
import { RtcPeerFactory } from '../rtc-peer-factory.service';

@Component({
  selector: 'dnd-audio-listener-page',
  template: `Connection ID: {{ id }}<br>
  <button>I am playing, promise</button>`,
})
export class ListenerPageComponent implements OnInit, OnDestroy {

  public id: string;

  private peer: RtcListenerPeer;

  constructor(
    private rtcPeerFactory: RtcPeerFactory
  ) {
    this.id = '';
  }

  public ngOnInit(): void {
    const audio = new AudioContext();

    this.peer = this.rtcPeerFactory.createListener();
    this.peer.init();
    this.peer.track$.subscribe((e) => {

      e.streams.forEach((stream) => {
        console.log('Listener page: Connected a track');

        this.initialiseStream(stream);

        const src = audio.createMediaStreamSource(stream);
        src.connect(audio.destination);
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
