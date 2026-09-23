import Phaser from 'phaser';
import {
  DEFAULT_CALIBRATION,
  pickWalkDirection,
  type WalkDirection,
} from '../config/characterAssets';
import {
  applyCharacterCalibration,
  createCharacterSprite,
  createCharacterWalkAnims,
  hasWalkSheets,
  preloadCharacterWalkSheets,
  registerCharacterWalkSheets,
  initCharacterIdlePose,
  setCharacterIdlePose,
  setCharacterWalkPose,
} from '../systems/characterSprites';

function isoDelta(moveX: number, moveY: number): { x: number; y: number } {
  return { x: moveX - moveY, y: (moveX + moveY) * 0.5 };
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private cal = { ...DEFAULT_CALIBRATION };
  private hasIdleTexture = false;
  private useSprites = false;
  private walkState = {
    isWalking: false,
    currentWalkDir: 'SE' as WalkDirection,
    currentAnimKey: '',
  };

  private followPointer = false;
  private followX = 0;
  private followY = 0;
  private moveToActive = false;
  private moveToX = 0;
  private moveToY = 0;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private isDragging = false;
  private readonly dragThreshold = 12;
  private readonly arriveDistance = 5;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    preloadCharacterWalkSheets(this);
  }

  create() {
    this.cameras.main.setBackgroundColor('#111111');
    this.drawIsoGrid();
    this.createPlayer();
    this.createHudText();
    this.setupInput();
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  private drawIsoGrid() {
    const g = this.add.graphics();
    g.lineStyle(1, 0x333333, 1);
    for (let x = 0; x < 1024; x += 64) {
      for (let y = 0; y < 768; y += 32) {
        g.strokeLineShape(new Phaser.Geom.Line(x, y, x + 32, y + 16));
        g.strokeLineShape(new Phaser.Geom.Line(x + 32, y + 16, x, y + 32));
      }
    }
  }

  private createPlayer() {
    if (hasWalkSheets(this)) {
      const meta = registerCharacterWalkSheets(this);
      createCharacterWalkAnims(this, this.cal.frameDurationMs);
      this.hasIdleTexture = meta.hasIdleTexture;
      this.player = createCharacterSprite(this, 512, 400, this.hasIdleTexture);
      applyCharacterCalibration(this.player as Phaser.GameObjects.Sprite, this.cal);
      initCharacterIdlePose(this.player as Phaser.GameObjects.Sprite, this.hasIdleTexture, 'SE');
      this.useSprites = true;
      return;
    }

    this.player = this.add.circle(512, 400, 16, 0x00ff00);
  }

  private createHudText() {
    this.add.text(20, 20, 'Click = vai · Trascina = segui · Frecce = muovi', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    this.add.text(
      20,
      48,
      this.useSprites
        ? 'Shadowborn — personaggio 8 direzioni (25 frame)'
        : 'Shadowborn — placeholder (mancano PNG in public/assets/character/)',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#888888',
      },
    );
  }

  private setupInput() {
    this.input.topOnly = false;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerDownX = pointer.worldX;
      this.pointerDownY = pointer.worldY;
      this.isDragging = false;
      this.followPointer = false;
      this.moveToActive = true;
      this.moveToX = pointer.worldX;
      this.moveToY = pointer.worldY;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;

      const moved = Math.hypot(pointer.worldX - this.pointerDownX, pointer.worldY - this.pointerDownY);
      if (moved >= this.dragThreshold) {
        this.isDragging = true;
        this.followPointer = true;
        this.moveToActive = false;
      }

      if (this.followPointer) {
        this.followX = pointer.worldX;
        this.followY = pointer.worldY;
      } else {
        this.moveToX = pointer.worldX;
        this.moveToY = pointer.worldY;
      }
    });

    const releasePointer = () => {
      if (this.followPointer || this.isDragging) {
        this.followPointer = false;
        this.isDragging = false;
        if (this.useSprites) {
          setCharacterIdlePose(this.player as Phaser.GameObjects.Sprite, this.hasIdleTexture, this.walkState);
        }
      }
    };

    this.input.on('pointerup', releasePointer);
    this.input.on('pointerupoutside', releasePointer);
  }

  private tryStep(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    const nextX = Phaser.Math.Clamp(this.player.x + dx, 16, 1008);
    const nextY = Phaser.Math.Clamp(this.player.y + dy, 16, 752);
    this.player.setPosition(nextX, nextY);
  }

  private moveWithDirection(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    if (this.useSprites) {
      const dir = pickWalkDirection(dx, dy);
      setCharacterWalkPose(this.player as Phaser.GameObjects.Sprite, dir, this.walkState);
    }
    this.tryStep(dx, dy);
  }

  private updateKeyboardMovement(): void {
    let moveX = 0;
    let moveY = 0;

    if (this.cursors.left?.isDown) moveX -= this.cal.moveSpeed;
    if (this.cursors.right?.isDown) moveX += this.cal.moveSpeed;
    if (this.cursors.up?.isDown) moveY -= this.cal.moveSpeed;
    if (this.cursors.down?.isDown) moveY += this.cal.moveSpeed;

    if (moveX === 0 && moveY === 0) {
      if (this.useSprites && this.walkState.isWalking) {
        setCharacterIdlePose(this.player as Phaser.GameObjects.Sprite, this.hasIdleTexture, this.walkState);
      }
      return;
    }

    this.followPointer = false;
    this.moveToActive = false;
    const delta = isoDelta(moveX, moveY);
    this.moveWithDirection(delta.x, delta.y);
  }

  private updateMoveTo(): void {
    if (!this.moveToActive) return;

    const dx = this.moveToX - this.player.x;
    const dy = this.moveToY - this.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < this.arriveDistance) {
      this.moveToActive = false;
      if (this.useSprites) {
        setCharacterIdlePose(this.player as Phaser.GameObjects.Sprite, this.hasIdleTexture, this.walkState);
      }
      return;
    }

    this.moveWithDirection((dx / dist) * this.cal.moveSpeed, (dy / dist) * this.cal.moveSpeed);
  }

  private updatePointerFollow(): void {
    if (!this.followPointer) return;

    const dx = this.followX - this.player.x;
    const dy = this.followY - this.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) {
      if (this.useSprites && this.walkState.isWalking) {
        setCharacterIdlePose(this.player as Phaser.GameObjects.Sprite, this.hasIdleTexture, this.walkState);
      }
      return;
    }

    this.moveWithDirection((dx / dist) * this.cal.moveSpeed, (dy / dist) * this.cal.moveSpeed);
  }

  update() {
    if (!this.player || !this.cursors) return;

    const keyActive =
      this.cursors.left?.isDown ||
      this.cursors.right?.isDown ||
      this.cursors.up?.isDown ||
      this.cursors.down?.isDown;

    if (keyActive) {
      this.updateKeyboardMovement();
      return;
    }

    if (this.followPointer) {
      this.updatePointerFollow();
    } else if (this.moveToActive) {
      this.updateMoveTo();
    }
  }
}
