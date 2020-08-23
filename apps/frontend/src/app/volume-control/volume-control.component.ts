import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'dnd-audio-volume-control',
  template: `
    <input
      #volumeElt
      type="range"
      min="0" max="200"
      [value]="volume"
      step="1"
      (input)="setVolume(volumeElt.value)"
    > <input
      style="width: 40px"
      type="number"
      [value]="volume"
      (change)="setVolume($event.target.value)"
      min="0" max="200"
    >
  <button (click)="toggleMute()">{{ volume > 0 ? 'Mute' : 'Unmute' }}</button>`,
})
export class VolumeControlComponent implements OnInit {

  @Input('gain')
  public gainNode: GainNode;

  @Input('volume')
  public set volume(volume: string | number) {
    this.setVolume(volume);
  }

  public get volume(): string | number {
    return this._volume;
  }

  private _volume = 100;
  private volumeBeforeMuting = 0;

  private isInitialised = false;

  public ngOnInit(): void {
    this.isInitialised = true;

    this.setVolume(this._volume);
  }

  public toggleMute(): void {
    if (this.volume === 0) {
      const newVolume = this.volumeBeforeMuting <= 0 ? 100 : this.volumeBeforeMuting;
      this.setVolume(newVolume);
    } else {
      this.volumeBeforeMuting = this._volume;
      this.setVolume(0);
    }
  }

  public setVolume(volume: number | string): void {
    this._volume = +volume;
    if (!this.isInitialised) {
      return;
    }

    const gain = this._volume / 100;
    // For volume changing, gain can go from 0 (silent) to 1 (normal) or 2 (louder).
    // If gain is negative, it will invert the frequency values.
    this.gainNode.gain.value = gain;
  }
}
