export interface Track {
  _id?: string;
  filename: string;
  size: number,
  metadata: any;
}

export interface MediaCollection {
  tracks: Track[];
}
