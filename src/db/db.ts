import Dexie, { type Table } from 'dexie';

export interface Temple {
  id: number; // 札所番号 1-88
  name: string; // 寺名
  sect: string; // 宗派
  honzon: string; // ご本尊
  prefecture: string; // 所在県（実所在地）
  city: string; // 市町村
  lat: number | null; // 緯度（出典確認後に投入）
  lng: number | null; // 経度（出典確認後に投入）
}

export interface Visit {
  id?: number;
  templeId: number;
  visitedOn: string; // YYYY-MM-DD
  companionIds: number[];
  weather?: string;
  transport?: string;
  photoIds: number[];
  note?: string;
  nokyo: boolean; // 納経の有無
  createdAt: number;
  updatedAt: number;
}

export interface Companion {
  id?: number;
  name: string;
  relation?: string;
}

export interface Photo {
  id?: number;
  blob: Blob;
  mime: string;
  createdAt: number;
}

export class HenroDB extends Dexie {
  temples!: Table<Temple, number>;
  visits!: Table<Visit, number>;
  companions!: Table<Companion, number>;
  photos!: Table<Photo, number>;

  constructor() {
    super('henro-log');
    this.version(1).stores({
      temples: 'id, prefecture',
      visits: '++id, templeId, visitedOn, *companionIds',
      companions: '++id, name',
      photos: '++id',
    });
  }
}

export const db = new HenroDB();
