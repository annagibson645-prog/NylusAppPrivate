import { truncateAtWord, cleanTitle } from './string-utils';

describe('truncateAtWord', () => {
  it('does not truncate short strings', () => {
    expect(truncateAtWord('Hello', 10)).toBe('Hello');
  });

  it('truncates at word boundary', () => {
    expect(truncateAtWord('Hello world example', 12)).toBe('Hello world…');
  });

  it('handles strings with no spaces', () => {
    expect(truncateAtWord('verylongword', 5)).toBe('very…');
  });

  it('handles empty input', () => {
    expect(truncateAtWord('', 10)).toBe('');
  });
});

describe('cleanTitle', () => {
  it('removes Collision prefix', () => {
    expect(cleanTitle('Collision: Idea A vs Idea B')).toBe('Idea A vs Idea B');
  });

  it('removes Spark prefix', () => {
    expect(cleanTitle('Spark: A thought')).toBe('A thought');
  });

  it('preserves normal titles', () => {
    expect(cleanTitle('Normal Title')).toBe('Normal Title');
  });
});
