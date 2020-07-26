import { Injectable, NgZone } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { RtcPeer } from './rtc-peer.service';

export const rtcConfig = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class RtcPeerFactory {

  constructor(
    private zone: NgZone
  ) {}

  public createListener() {
    return new RtcPeer(new Socket({
      url: 'http://localhost:3333',
    }), this.zone, rtcConfig);
  }
}
