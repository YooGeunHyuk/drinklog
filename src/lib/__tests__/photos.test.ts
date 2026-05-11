import {
  getDrinkLogPhotos,
  hasDrinkLogPhoto,
  buildDrinkLogPhotoFields,
} from '../photos';

describe('getDrinkLogPhotos', () => {
  it('returns photo_urls when populated', () => {
    expect(
      getDrinkLogPhotos({ photo_url: null, photo_urls: ['a', 'b'] }),
    ).toEqual(['a', 'b']);
  });

  it('falls back to photo_url when photo_urls is null', () => {
    expect(
      getDrinkLogPhotos({ photo_url: 'legacy-url', photo_urls: null }),
    ).toEqual(['legacy-url']);
  });

  it('falls back to photo_url when photo_urls is empty', () => {
    expect(
      getDrinkLogPhotos({ photo_url: 'legacy-url', photo_urls: [] }),
    ).toEqual(['legacy-url']);
  });

  it('returns empty array when both null', () => {
    expect(
      getDrinkLogPhotos({ photo_url: null, photo_urls: null }),
    ).toEqual([]);
  });

  it('prefers photo_urls over photo_url when both present', () => {
    expect(
      getDrinkLogPhotos({ photo_url: 'legacy', photo_urls: ['new1', 'new2'] }),
    ).toEqual(['new1', 'new2']);
  });
});

describe('hasDrinkLogPhoto', () => {
  it('true when photo_urls has entries', () => {
    expect(hasDrinkLogPhoto({ photo_url: null, photo_urls: ['a'] })).toBe(true);
  });

  it('true when only photo_url is set (legacy data)', () => {
    expect(hasDrinkLogPhoto({ photo_url: 'a', photo_urls: null })).toBe(true);
  });

  it('false when both are empty/null', () => {
    expect(hasDrinkLogPhoto({ photo_url: null, photo_urls: null })).toBe(false);
    expect(hasDrinkLogPhoto({ photo_url: null, photo_urls: [] })).toBe(false);
  });
});

describe('buildDrinkLogPhotoFields', () => {
  it('empty array → both null', () => {
    expect(buildDrinkLogPhotoFields([])).toEqual({
      photo_url: null,
      photo_urls: null,
    });
  });

  it('one photo → photo_url = first, photo_urls = [first]', () => {
    expect(buildDrinkLogPhotoFields(['x'])).toEqual({
      photo_url: 'x',
      photo_urls: ['x'],
    });
  });

  it('multiple photos → photo_url = first, photo_urls = full array', () => {
    expect(buildDrinkLogPhotoFields(['a', 'b', 'c'])).toEqual({
      photo_url: 'a',
      photo_urls: ['a', 'b', 'c'],
    });
  });
});
