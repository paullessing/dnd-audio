import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RtcListenerPeer } from '../rtc-listener-peer';
import { RtcPeerFactory } from '../rtc-peer-factory.service';

@Component({
  selector: 'dnd-audio-listener-page',
  template: `Connection ID: {{ id }}<br>
  <audio #media></audio>
  <button>Play</button>`,
})
export class ListenerPageComponent implements OnInit, OnDestroy {

  public id: string;

  @ViewChild('media')
  public mediaEl: ElementRef<HTMLMediaElement>;

  private peer: RtcListenerPeer;

  constructor(
    private rtcPeerFactory: RtcPeerFactory
  ) {
    this.id = '';
  }

  public ngOnInit(): void {
    this.init();
  }

  public init(): void {
    this.peer = this.rtcPeerFactory.createListener();
    this.peer.init();
    this.peer.track$.subscribe((e) => {
      console.log('Listener page: Got a track');
      this.mediaEl.nativeElement.srcObject = e.streams[0];
      this.mediaEl.nativeElement.play();
      this.id = 'Playing';
    });
    this.id = 'Initialised';
  }

  public ngOnDestroy(): void {
    this.peer.destroy();
  }
}
