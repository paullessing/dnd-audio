import { IAudioMetadata } from 'music-metadata';

export type ReplaceDeep<T, A, B> = {
  [K in keyof T]: Replace<T[K], A, B>;
}

export type Replace<T, Match, Replacement> = T extends Match ? Replacement :
  T extends (infer A)[] ? Replace<A, Match, Replacement>[]:
    T extends object ? ReplaceDeep<T, Match, Replacement> :
      T;

export type SanitizedMetadata = ReplaceDeep<
  Omit<IAudioMetadata, 'native'>, // Contains keys with a '.' in them which messed up the DB, and we don't need them so we won't store them
  Buffer,
  string
>;

export interface Track {
  _id?: string;
  filename: string;
  size: number,
  metadata: SanitizedMetadata;
}

export interface MediaCollection {
  tracks: Track[];
}
