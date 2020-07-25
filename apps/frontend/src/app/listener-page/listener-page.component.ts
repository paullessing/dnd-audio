import { Component, OnInit } from '@angular/core';
import { PeerService } from '../peer.service';

@Component({
  selector: 'dnd-audio-listener-page',
  template: `Connection ID: {{ id }}`,
})
export class ListenerPageComponent implements OnInit {

  public id: string;

  constructor(
    private peers: PeerService
  ) {
    this.id = '';
  }

  public ngOnInit(): void {
    console.log('Initialising');
    const peer = this.peers.create();
    console.log('peer', peer);

    peer.on('open', (id) => {
      this.id = id;

      peer.connect('dnd-audio-server')
    });
  }

}
