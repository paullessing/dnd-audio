import { Component, OnInit } from '@angular/core';
import { PeerService } from '../peer.service';

@Component({
  selector: 'dnd-audio-stream-page',
  template: `Status: {{ status }}`,
})
export class StreamPageComponent implements OnInit {

  public status: string;

  constructor(
    private peers: PeerService
  ) {
    this.status = 'NONE';
  }

  public ngOnInit(): void {
    console.log('Initialising');
    const peer = this.peers.create('dnd-audio-server');
    console.log('peer', peer);

    this.status = 'CONNECTING';

    peer.on('open', () => {
      this.status = 'CONNECTED';
    });
  }

}
