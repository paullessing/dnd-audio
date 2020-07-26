import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RtcListenerPeer } from '../rtc-listener-peer';
import { RtcPeerFactory } from '../rtc-peer-factory.service';

@Component({
  selector: 'dnd-audio-listener-page',
  template: `Connection ID: {{ id }}<br><video #video muted></video>`,
})
export class ListenerPageComponent implements OnInit, OnDestroy {

  public id: string;

  @ViewChild('video')
  public videoEl: ElementRef<HTMLVideoElement>;

  private peer: RtcListenerPeer;

  constructor(
    private rtcPeerFactory: RtcPeerFactory
  ) {
    this.id = '';
  }

  public ngOnInit(): void {
    this.peer = this.rtcPeerFactory.createListener();
    this.peer.init();
    this.peer.track$.subscribe((e) => {
      this.videoEl.nativeElement.srcObject = e.streams[0];
      this.videoEl.nativeElement.play();
    });
  }

  public ngOnDestroy(): void {
    this.peer.destroy();
  }
}
