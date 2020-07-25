import { Injectable } from '@angular/core';
import type Peer from 'peerjs';

@Injectable({
  providedIn: 'root'
})
export class PeerService {

  public create(id?: string): Peer {
    return new (window as any).Peer(id, {
      host: 'localhost',
      port: 9000,
      // path: '/api/peer',
    });
  }
}
