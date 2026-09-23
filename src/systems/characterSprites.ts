import Phaser from 'phaser';
import {
  AVAILABLE_WALK_DIRS,
  DEFAULT_CALIBRATION,
  DIRECTION_ANIM,
  DIRECTION_ORDER,
  WALK_SHEET_FILES,
  WALK_SHEET_DIMENSIONS,
  WALK_SHEET_GRID,
  pickWalkDirection,
  type WalkDirection,
} from '../config/characterAssets';

export type CharacterCalibration = typeof DEFAULT_CALIBRATION;

const { frameWidth: FRAME_W, frameHeight: FRAME_H } = WALK_SHEET_DIMENSIONS;

export function preloadCharacterWalkSheets(scene: Phaser.Scene): void {
  for (const dir of DIRECTION_ORDER) {
    const { key, path } = WALK_SHEET_FILES[dir];
    if (!scene.textures.exists(key)) {
      scene.load.spritesheet(key, path, {
        frameWidth: FRAME_W,
        frameHeight: FRAME_H,
      });
    }
  }
  // Idle disabilitato per ora — non precaricare idle.png
}

export function registerCharacterWalkSheets(scene: Phaser.Scene): {
  frameW: number;
  frameH: number;
  hasIdleTexture: boolean;
} {
  for (const dir of DIRECTION_ORDER) {
    const sheetKey = WALK_SHEET_FILES[dir].key;
    if (scene.textures.exists(sheetKey)) {
      scene.textures.get(sheetKey).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
  }

  return {
    frameW: FRAME_W,
    frameH: FRAME_H,
    hasIdleTexture: false,
  };
}

export function createCharacterWalkAnims(
  scene: Phaser.Scene,
  frameDurationMs: number,
): void {
  const { framesPerDir } = WALK_SHEET_GRID;

  for (const dir of DIRECTION_ORDER) {
    const animKey = DIRECTION_ANIM[dir];
    const sheetKey = WALK_SHEET_FILES[dir].key;

    if (!scene.textures.exists(sheetKey)) continue;
    if (scene.anims.exists(animKey)) scene.anims.remove(animKey);

    scene.anims.create({
      key: animKey,
      frames: scene.anims.generateFrameNumbers(sheetKey, { start: 1, end: framesPerDir - 1 }),
      frameRate: 1000 / frameDurationMs,
      repeat: -1,
    });
  }
}

export function hasWalkSheets(scene: Phaser.Scene): boolean {
  return AVAILABLE_WALK_DIRS.some((dir) => scene.textures.exists(WALK_SHEET_FILES[dir].key));
}

export function createCharacterSprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  hasIdleTexture: boolean,
): Phaser.GameObjects.Sprite {
  const sheetKey = WALK_SHEET_FILES.SE.key;
  const sprite = scene.add.sprite(x, y, sheetKey, 1);
  sprite.setDepth(10);
  return sprite;
}

export function setCharacterWalkPose(
  sprite: Phaser.GameObjects.Sprite,
  direction: WalkDirection,
  state: { isWalking: boolean; currentWalkDir: WalkDirection; currentAnimKey: string },
): void {
  const dir: WalkDirection = AVAILABLE_WALK_DIRS.includes(direction) ? direction : AVAILABLE_WALK_DIRS[0];
  const animKey = DIRECTION_ANIM[dir];
  const sheetKey = WALK_SHEET_FILES[dir].key;

  state.isWalking = true;
  state.currentWalkDir = dir;

  if (sprite.texture.key !== sheetKey) {
    sprite.setTexture(sheetKey);
  }

  const sameAnim = state.currentAnimKey === animKey;
  if (!(sprite.anims.isPlaying && sameAnim)) {
    state.currentAnimKey = animKey;
    sprite.play(animKey);
  }
}

export function initCharacterIdlePose(
  sprite: Phaser.GameObjects.Sprite,
  _hasIdleTexture: boolean,
  direction: WalkDirection = 'SE',
): void {
  sprite.anims.stop();
  sprite.setTexture(WALK_SHEET_FILES[direction].key, 1);
}

export function setCharacterIdlePose(
  sprite: Phaser.GameObjects.Sprite,
  _hasIdleTexture: boolean,
  state: { isWalking: boolean; currentWalkDir: WalkDirection; currentAnimKey: string },
): void {
  if (!state.isWalking && !sprite.anims.isPlaying) return;

  state.isWalking = false;
  state.currentAnimKey = '';
  sprite.anims.stop();
  sprite.setTexture(WALK_SHEET_FILES[state.currentWalkDir].key, 1);
}

export function applyCharacterCalibration(
  sprite: Phaser.GameObjects.Sprite,
  cal: CharacterCalibration,
): void {
  sprite.setOrigin(cal.originX, cal.originY);
  sprite.setScale(cal.scale);
}

export { pickWalkDirection, AVAILABLE_WALK_DIRS, type WalkDirection };
