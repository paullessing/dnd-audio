import { Injectable, NgZone } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { environment } from '../environments/environment';
import { RtcBroadcasterPeer } from './rtc-broadcaster-peer';
import { RtcListenerPeer } from './rtc-listener-peer';

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
    return new RtcListenerPeer(new Socket({
      url: environment.websocketServer,
    }), this.zone, rtcConfig);
  }

  public createBroadcaster() {
    return new RtcBroadcasterPeer(new Socket({
      url: environment.websocketServer
    }), this.zone, rtcConfig);
  }
}
