// * These typings are incomplete, but they are enough to get the app working.
// * Reference: https://github.com/roogue/osu-collector-node/blob/main/src/typings/Collection.ts

// Basic Json Interface
export interface Json {
  [x: string]: JsonValues;
}
export type JsonValues = string | number | boolean | Date | Json | JsonArray;
type JsonArray = Array<string | number | boolean | Date | Json | JsonArray>;

export type Mode = "taiko" | "osu" | "fruits" | "mania";
export enum ModeByte {
  "osu" = 0,
  "taiko" = 1,
  "fruits" = 2,
  "mania" = 3,
}

export type WorkingMode = 1 | 2 | 3;

export type Cursors = number[];

export interface Condition {
  retry_input: boolean;
  retry_mode: boolean;
  new_version: string | null;
  fetched_collection: number;
  downloaded_beatmapset: number;
  download_log: string[];
  indexed_songs: number;
  total_songs: number;
}
