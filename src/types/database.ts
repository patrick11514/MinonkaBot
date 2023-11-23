import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface Languages {
  language: "cs" | "en";
  user_id: string;
}

export interface RiotLink {
  gameName: string;
  id: Generated<number>;
  puuid: string;
  tagLine: string;
  user_id: string;
}

export interface UserLink {
  id: Generated<number>;
  name: string;
  puuid: string;
  region: string;
  user_id: string;
}

export interface DB {
  languages: Languages;
  riot_link: RiotLink;
  user_link: UserLink;
}
