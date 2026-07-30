import { describe, it, expect } from 'vitest';
import {
  getGuideSet,
  SANKOFA_GUIDE,
  CHARLESTON_GUIDE,
  CHARLESTON_TRIP_ID,
  CHICAGO_HIGHLIGHTS,
  RESTAURANTS,
  ACTIVITIES,
  EVENTS,
  CHARLESTON_EATS,
  CHARLESTON_HIGHLIGHTS,
} from '@/lib/itinerary-data';

/**
 * Guard test for the 2026-07-29 Charleston ingest.
 *
 * The Trip Guide used to read four module constants directly, so every trip saw
 * Chicago. Making it trip-scoped is only safe if the Sankofa path still resolves
 * to the *same array objects* it always did — that's what these assertions pin
 * down. If someone later "tidies up" by merging Charleston entries into
 * RESTAURANTS, the identity checks below fail loudly.
 */
describe('trip-scoped guide registry', () => {
  describe('Sankofa is untouched', () => {
    it('points at the original arrays by reference, not a copy', () => {
      expect(SANKOFA_GUIDE.essentials.items).toBe(ACTIVITIES);
      expect(SANKOFA_GUIDE.restaurants.items).toBe(RESTAURANTS);
      expect(SANKOFA_GUIDE.highlights.items).toBe(CHICAGO_HIGHLIGHTS);
      expect(SANKOFA_GUIDE.cultural.items).toBe(EVENTS);
    });

    it('keeps the original section copy verbatim', () => {
      expect(SANKOFA_GUIDE.essentials.title).toBe('Getting Around & Essentials');
      expect(SANKOFA_GUIDE.restaurants.title).toBe('Where to Eat');
      expect(SANKOFA_GUIDE.highlights.title).toBe('Chicago Highlights');
      expect(SANKOFA_GUIDE.cultural.title).toBe('Cultural Sites');
      expect(SANKOFA_GUIDE.restaurants.subtitle).toBe(`${RESTAURANTS.length} places to eat`);
    });

    it('no Charleston entry leaked into a Sankofa array', () => {
      const sankofaIds = [...ACTIVITIES, ...RESTAURANTS, ...CHICAGO_HIGHLIGHTS, ...EVENTS].map(i => i.id);
      expect(sankofaIds.some(id => id.startsWith('chs-'))).toBe(false);
    });
  });

  describe('resolution', () => {
    it('falls back to Sankofa when there is no trip — the pre-existing behaviour', () => {
      expect(getGuideSet(undefined)).toBe(SANKOFA_GUIDE);
      expect(getGuideSet(null)).toBe(SANKOFA_GUIDE);
    });

    it('falls back to Sankofa for an unrecognised trip', () => {
      expect(getGuideSet({ id: 'some-other-uuid', title: 'Lisbon', location_name: 'Portugal' }))
        .toBe(SANKOFA_GUIDE);
    });

    it('resolves the Sankofa trip to the Chicago set', () => {
      expect(getGuideSet({
        id: 'cb6f65f0-b34b-467a-a206-051cc8914db0',
        title: 'Sankofa 2026',
        location_name: 'Oak Brook, IL',
      })).toBe(SANKOFA_GUIDE);
    });

    it('resolves Charleston by trip id', () => {
      expect(getGuideSet({ id: CHARLESTON_TRIP_ID })).toBe(CHARLESTON_GUIDE);
    });

    it('resolves Charleston by name when the id differs (re-seed safety net)', () => {
      expect(getGuideSet({ id: 'different', title: 'Charleston, all of us', location_name: null }))
        .toBe(CHARLESTON_GUIDE);
      expect(getGuideSet({ id: 'different', title: null, location_name: 'Charleston, SC — West Ashley' }))
        .toBe(CHARLESTON_GUIDE);
    });
  });

  describe('Charleston content survived translation', () => {
    it('has no empty section (all four would render)', () => {
      expect(CHARLESTON_GUIDE.essentials.items.length).toBeGreaterThan(0);
      expect(CHARLESTON_GUIDE.restaurants.items.length).toBeGreaterThan(0);
      expect(CHARLESTON_GUIDE.highlights.items.length).toBeGreaterThan(0);
      expect(CHARLESTON_GUIDE.cultural.items.length).toBeGreaterThan(0);
    });

    it('puts the eating list in Where-to-Eat, not the itinerary', () => {
      expect(CHARLESTON_GUIDE.restaurants.items).toBe(CHARLESTON_EATS);
      expect(CHARLESTON_EATS.length).toBeGreaterThanOrEqual(20);
    });

    it('keeps both flights on the essentials plate', () => {
      const flights = CHARLESTON_GUIDE.essentials.items.find(i => i.id === 'chs-ess-flights');
      expect(flights?.description).toContain('UA 2355');
      expect(flights?.description).toContain('UA 674');
    });

    it('marks the pirate cruise as an anchor', () => {
      const pirates = CHARLESTON_HIGHLIGHTS.find(i => i.id === 'chs-highlight-pirates');
      expect(pirates?.description).toContain('ANCHOR');
    });

    it('carries the Tuesday rain plan and the age floor', () => {
      const museum = CHARLESTON_HIGHLIGHTS.find(i => i.id === 'chs-highlight-childrens-museum');
      expect(museum?.description).toContain('rain plan');
      const middleton = CHARLESTON_HIGHLIGHTS.find(i => i.id === 'chs-highlight-middleton');
      expect(middleton?.description).toContain('riders 8 and up');
    });

    it('every Charleston id is unique and namespaced', () => {
      const all = [
        ...CHARLESTON_GUIDE.essentials.items,
        ...CHARLESTON_GUIDE.restaurants.items,
        ...CHARLESTON_GUIDE.highlights.items,
        ...CHARLESTON_GUIDE.cultural.items,
      ];
      const ids = all.map(i => i.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every(id => id.startsWith('chs-'))).toBe(true);
    });

    it('any entry with coordinates has plausible Charleston-area ones', () => {
      const all = [
        ...CHARLESTON_GUIDE.essentials.items,
        ...CHARLESTON_GUIDE.restaurants.items,
        ...CHARLESTON_GUIDE.highlights.items,
        ...CHARLESTON_GUIDE.cultural.items,
      ];
      for (const item of all) {
        if (!item.location) continue;
        expect(item.location.lat, `${item.id} lat`).toBeGreaterThan(32.5);
        expect(item.location.lat, `${item.id} lat`).toBeLessThan(33.1);
        expect(item.location.lng, `${item.id} lng`).toBeGreaterThan(-80.3);
        expect(item.location.lng, `${item.id} lng`).toBeLessThan(-79.7);
      }
    });
  });
});
