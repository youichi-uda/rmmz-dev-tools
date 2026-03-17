import { describe, it, expect } from 'vitest';
import {
  TOP_LEVEL_TAGS,
  PARAM_TAGS,
  COMMAND_TAGS,
  ARG_TAGS,
  TYPE_VALUES,
  TYPE_VALUES_BASIC,
  TYPE_VALUES_DATABASE,
  TYPE_DESCRIPTIONS,
  TAG_DESCRIPTIONS,
  TYPE_SPECIFIC_TAGS,
} from '../annotation/tags';

describe('tag definitions', () => {
  it('all TOP_LEVEL_TAGS have descriptions', () => {
    for (const tag of TOP_LEVEL_TAGS) {
      expect(TAG_DESCRIPTIONS[tag], `Missing description for top-level tag: ${tag}`).toBeDefined();
      expect(TAG_DESCRIPTIONS[tag].length).toBeGreaterThan(0);
    }
  });

  it('all PARAM_TAGS have descriptions', () => {
    for (const tag of PARAM_TAGS) {
      expect(TAG_DESCRIPTIONS[tag], `Missing description for param tag: ${tag}`).toBeDefined();
      expect(TAG_DESCRIPTIONS[tag].length).toBeGreaterThan(0);
    }
  });

  it('all COMMAND_TAGS have descriptions', () => {
    for (const tag of COMMAND_TAGS) {
      expect(TAG_DESCRIPTIONS[tag], `Missing description for command tag: ${tag}`).toBeDefined();
      expect(TAG_DESCRIPTIONS[tag].length).toBeGreaterThan(0);
    }
  });

  it('all TYPE_VALUES have descriptions', () => {
    for (const type of TYPE_VALUES) {
      expect(TYPE_DESCRIPTIONS[type], `Missing description for type: ${type}`).toBeDefined();
      expect(TYPE_DESCRIPTIONS[type].length).toBeGreaterThan(0);
    }
  });

  it('TYPE_SPECIFIC_TAGS reference valid tags', () => {
    const allParamTags = new Set<string>(PARAM_TAGS);
    for (const [type, tags] of Object.entries(TYPE_SPECIFIC_TAGS)) {
      expect(TYPE_VALUES).toContain(type);
      for (const tag of tags) {
        expect(allParamTags.has(tag), `TYPE_SPECIFIC_TAGS["${type}"] references unknown tag: ${tag}`).toBe(true);
      }
    }
  });

  it('no duplicate tags in TOP_LEVEL_TAGS', () => {
    const set = new Set(TOP_LEVEL_TAGS);
    expect(set.size).toBe(TOP_LEVEL_TAGS.length);
  });

  it('no duplicate tags in PARAM_TAGS', () => {
    const set = new Set(PARAM_TAGS);
    expect(set.size).toBe(PARAM_TAGS.length);
  });

  it('no duplicate tags in COMMAND_TAGS', () => {
    const set = new Set(COMMAND_TAGS);
    expect(set.size).toBe(COMMAND_TAGS.length);
  });

  it('no duplicate values in TYPE_VALUES', () => {
    const set = new Set(TYPE_VALUES);
    expect(set.size).toBe(TYPE_VALUES.length);
  });

  it('TYPE_VALUES is the union of basic and database types', () => {
    expect(TYPE_VALUES).toHaveLength(TYPE_VALUES_BASIC.length + TYPE_VALUES_DATABASE.length);
    for (const v of TYPE_VALUES_BASIC) {
      expect(TYPE_VALUES).toContain(v);
    }
    for (const v of TYPE_VALUES_DATABASE) {
      expect(TYPE_VALUES).toContain(v);
    }
  });

  it('ARG_TAGS is the same as PARAM_TAGS', () => {
    expect(ARG_TAGS).toEqual(PARAM_TAGS);
  });
});
