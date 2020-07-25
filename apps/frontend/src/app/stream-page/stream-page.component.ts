import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dnd-audio-stream-page',
  template: `Status: {{ status }}<br><button *ngIf="status === 'CONNECTED'" (click)="go()">Get Stream</button>`,
})
export class StreamPageComponent implements OnInit {

  public status: string;

  private stream: Promise<MediaStream>;
  private resolve: any;

  constructor(
  ) {
    this.status = 'NONE';

    this.stream = new Promise((resolve) => this.resolve = resolve);
  }

  public ngOnInit(): void {
//     console.log('Initialising');
//     this.peer = this.peers.create('dnd-audio-server');
//     console.log('peer', this.peer);
//
//     this.status = 'CONNECTING';
//
//     this.peer.on('open', () => {
//       this.status = 'CONNECTED';
//     });
//
//     this.peer.on('error', (err) => {
//       console.log('Peer error', err);
//     });
//
//     this.peer.on('connection', async (dataConnection) => {
//       const id = dataConnection.peer;
//       console.log('Got connection from', id);
//
//       const stream = await this.stream;
//       console.log('Calling', id);
//       const call = this.peer.call(id, stream); // Send my media
//       console.log('Called', call);
//
//       dataConnection.close();
//     });
  }

  public go() {
//   const getUserMedia: typeof navigator.getUserMedia =
//     (navigator as any).getUserMedia ||
//     (navigator as any).webkitGetUserMedia ||
//     (navigator as any).mozGetUserMedia;
//
//   getUserMedia({ video: true },
//     (stream) => {
//       this.resolve(stream);
//       console.log('resolved', stream);
//     }, (err) => {
//     console.log('Failed to get local stream' , err);
//   });
  }

}
