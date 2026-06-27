import { db } from './db';
import { TEMPLES } from '../data/temples';

/**
 * 札所マスタを投入する。bulkPut なので冪等。
 * コード側のマスタを正として常に同期する（訪問記録には影響しない）。
 */
export async function ensureSeed(): Promise<void> {
  try {
    await db.temples.bulkPut(TEMPLES);
  } catch (e) {
    console.error('札所マスタの投入に失敗しました', e);
  }
}
