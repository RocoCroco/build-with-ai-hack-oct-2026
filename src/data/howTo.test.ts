import { describe, expect, it } from 'vitest';
import { EXERCISES, WARMUPS } from './exercises';
import { CUES, youtubeSearchUrl } from './howTo';

describe('how-to data', () => {
  it('has cues for every exercise and warm-up, and none left over', () => {
    const ids = [...EXERCISES, ...WARMUPS].map((x) => x.id);
    expect(ids.filter((id) => !CUES[id])).toEqual([]);
    expect(Object.keys(CUES).filter((id) => !ids.includes(id))).toEqual([]);
  });

  it('searches YouTube for the plain exercise name', () => {
    const url = new URL(youtubeSearchUrl('Plank (seconds)'));
    expect(url.hostname).toBe('www.youtube.com');
    expect(url.searchParams.get('search_query')).toBe('how to Plank proper form');
    expect(new URL(youtubeSearchUrl('Jumping jacks, 2 min')).searchParams.get('search_query')).toBe(
      'how to Jumping jacks proper form',
    );
  });
});
