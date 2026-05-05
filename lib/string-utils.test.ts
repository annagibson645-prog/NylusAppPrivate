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

  it('handles ellipsis longer than maxChars', () => {
    expect(truncateAtWord('Hello world', 3, '...')).toBe('H...');
  });

  it('handles null-like values gracefully', () => {
    expect(truncateAtWord('', 10)).toBe('');
    expect(truncateAtWord('text', 0)).toBe('');
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
