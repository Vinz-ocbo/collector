import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { db, setPreference } from '@/shared/db';
import {
  DEFAULT_VIEW_PREFS,
  getCollectionViewPrefs,
  setCollectionViewPrefs,
} from './preferences';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('collection view preferences', () => {
  it('returns the default prefs when nothing is stored', async () => {
    const prefs = await getCollectionViewPrefs();
    expect(prefs).toEqual(DEFAULT_VIEW_PREFS);
  });

  it('round-trips a saved value', async () => {
    await setCollectionViewPrefs({ sort: 'name-asc', view: 'list' });
    const prefs = await getCollectionViewPrefs();
    expect(prefs).toEqual({ sort: 'name-asc', view: 'list' });
  });

  it('falls back to defaults when stored values are unknown strings', async () => {
    await setPreference('collection.viewPrefs', { sort: 'bogus', view: 'whatever' });
    const prefs = await getCollectionViewPrefs();
    expect(prefs).toEqual(DEFAULT_VIEW_PREFS);
  });

  it('falls back per-field when only one value is corrupted', async () => {
    await setPreference('collection.viewPrefs', { sort: 'name-desc', view: 42 });
    const prefs = await getCollectionViewPrefs();
    expect(prefs).toEqual({ sort: 'name-desc', view: DEFAULT_VIEW_PREFS.view });
  });

  it('falls back to defaults when the stored row is not an object', async () => {
    await setPreference('collection.viewPrefs', 'oops');
    const prefs = await getCollectionViewPrefs();
    expect(prefs).toEqual(DEFAULT_VIEW_PREFS);
  });
});
