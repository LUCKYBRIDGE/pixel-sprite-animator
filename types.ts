
// FIX: Removed self-import of 'SpriteFrame' which conflicts with the interface declared in this file.
export enum AppStep {
  INTRO,
  PORTRAIT_GENERATION,
  PIXEL_ART_SELECTION,
  SPRITE_GENERATION,
  FINISHED,
  HISTORY,
}

export interface SpriteFrame {
  name: string;
  url: string;
}

export interface Creation {
  id: number;
  figureName: string;
  portraitUrl: string;
  baseCharacterUrl: string;
  frames: SpriteFrame[];
}
