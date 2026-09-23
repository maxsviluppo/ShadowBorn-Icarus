import Phaser from 'phaser';
import {
  AVAILABLE_WALK_DIRS,
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

export class AnimationLabScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private pivotMarker!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private cal = { ...DEFAULT_CALIBRATION };
  private frameW = 0;
  private frameH = 0;
  private hasIdleTexture = false;
  private labPanelBound = false;

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
  private walkState = {
    isWalking: false,
    currentWalkDir: 'SE' as WalkDirection,
    currentAnimKey: '',
  };

  constructor() {
    super({ key: 'AnimationLabScene' });
  }

  preload() {
    preloadCharacterWalkSheets(this);
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d1118');
    this.drawIsoGrid();

    try {
      if (!hasWalkSheets(this)) {
        this.showLabMessage(
          'Mancano gli sheet in public/assets/character/\n(N.png, NE.png, E.png, SE.png, S.png, SO.png, O.png, NO.png)',
        );
        this.bindLabPanel();
        return;
      }

      const meta = registerCharacterWalkSheets(this);
      if (meta.frameW <= 0 || meta.frameH <= 0) {
        this.showLabMessage('Errore: dimensioni frame non valide.\nRiesegui npm run sprites');
        this.bindLabPanel();
        return;
      }

      this.frameW = meta.frameW;
      this.frameH = meta.frameH;
      this.hasIdleTexture = meta.hasIdleTexture;
      createCharacterWalkAnims(this, this.cal.frameDurationMs);
      this.createPlayer();
      this.createHud();
      this.setupInput();

      if (!this.input.keyboard) {
        this.showLabMessage('Input tastiera non disponibile.\nClicca sul canvas e riprova.');
      } else {
        this.cursors = this.input.keyboard.createCursorKeys();
      }

      this.bindLabPanel();
      this.applyCalibration();
    } catch (err) {
      console.error('[AnimationLabScene]', err);
      this.showLabMessage(`Errore Room Lab:\n${err instanceof Error ? err.message : String(err)}`);
      this.bindLabPanel();
    }
  }

  private showLabMessage(message: string) {
    this.add
      .text(512, 384, message, {
        fontSize: '16px',
        color: '#8aa4c0',
        align: 'center',
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5)
      .setDepth(100);
  }

  private createPlayer() {
    this.player = createCharacterSprite(this, 512, 400, this.hasIdleTexture);
    applyCharacterCalibration(this.player, this.cal);
    initCharacterIdlePose(this.player, this.hasIdleTexture, 'SE');
    this.pivotMarker = this.add.graphics().setDepth(11);
    this.drawPivot();
  }

  private drawIsoGrid() {
    const g = this.add.graphics().setDepth(0);
    g.lineStyle(1, 0x2a3344, 1);
    for (let x = 0; x < 1024; x += 64) {
      for (let y = 0; y < 768; y += 32) {
        g.strokeLineShape(new Phaser.Geom.Line(x, y, x + 32, y + 16));
        g.strokeLineShape(new Phaser.Geom.Line(x + 32, y + 16, x, y + 32));
      }
    }
  }

  private createHud() {
    const dirs = AVAILABLE_WALK_DIRS.join(', ');
    this.add.text(16, 12, 'ROOM LAB — sheet 8 direzioni', {
      fontSize: '18px',
      color: '#e8f4ff',
    }).setDepth(20);
    this.add.text(16, 36, `Direzioni: ${dirs} · Click / Trascina / Frecce`, {
      fontSize: '13px',
      color: '#6a8aaa',
    }).setDepth(20);
    this.add.text(
      16,
      56,
      `Frame ${this.frameW}×${this.frameH}px · griglia 5×5 · ${this.cal.frameDurationMs}ms · mov ${this.cal.moveSpeed}px/f`,
      { fontSize: '11px', color: '#4a6070' },
    ).setDepth(20);
  }

  private setupInput() {
    this.input.topOnly = false;

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.pointerDownX = p.worldX;
      this.pointerDownY = p.worldY;
      this.isDragging = false;
      this.followPointer = false;
      this.moveToActive = true;
      this.moveToX = p.worldX;
      this.moveToY = p.worldY;
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;

      const moved = Math.hypot(p.worldX - this.pointerDownX, p.worldY - this.pointerDownY);
      if (moved >= this.dragThreshold) {
        this.isDragging = true;
        this.followPointer = true;
        this.moveToActive = false;
      }

      if (this.followPointer) {
        this.followX = p.worldX;
        this.followY = p.worldY;
      } else {
        this.moveToX = p.worldX;
        this.moveToY = p.worldY;
      }
    });

    const releasePointer = () => {
      if (!this.player) return;
      if (this.followPointer || this.isDragging) {
        this.followPointer = false;
        this.isDragging = false;
        setCharacterIdlePose(this.player, this.hasIdleTexture, this.walkState);
      }
    };

    this.input.on('pointerup', releasePointer);
    this.input.on('pointerupoutside', releasePointer);
  }

  private bindLabPanel() {
    if (this.labPanelBound) return;
    this.labPanelBound = true;

    const setVal = (id: string, v: number, d = 2) => {
      const el = document.getElementById(id);
      if (el) el.textContent = d === 0 ? String(Math.round(v)) : v.toFixed(d);
    };

    const ox = document.getElementById('lab-origin-x') as HTMLInputElement;
    const oy = document.getElementById('lab-origin-y') as HTMLInputElement;
    const sc = document.getElementById('lab-scale') as HTMLInputElement;
    const ms = document.getElementById('lab-frame-ms') as HTMLInputElement;
    const mv = document.getElementById('lab-move-speed') as HTMLInputElement;

    if (ox) {
      ox.value = String(this.cal.originX);
      setVal('lab-origin-x-val', this.cal.originX);
      ox.oninput = () => {
        this.cal.originX = parseFloat(ox.value);
        setVal('lab-origin-x-val', this.cal.originX);
        this.applyCalibration();
      };
    }
    if (oy) {
      oy.value = String(this.cal.originY);
      setVal('lab-origin-y-val', this.cal.originY);
      oy.oninput = () => {
        this.cal.originY = parseFloat(oy.value);
        setVal('lab-origin-y-val', this.cal.originY);
        this.applyCalibration();
      };
    }
    if (sc) {
      sc.value = String(this.cal.scale);
      setVal('lab-scale-val', this.cal.scale);
      sc.oninput = () => {
        this.cal.scale = parseFloat(sc.value);
        setVal('lab-scale-val', this.cal.scale);
        this.applyCalibration();
      };
    }
    if (ms) {
      ms.value = String(this.cal.frameDurationMs);
      setVal('lab-frame-ms-val', this.cal.frameDurationMs, 0);
      ms.oninput = () => {
        this.cal.frameDurationMs = parseInt(ms.value, 10);
        setVal('lab-frame-ms-val', this.cal.frameDurationMs, 0);
        setVal('lab-fps-val', 1000 / this.cal.frameDurationMs);
        createCharacterWalkAnims(this, this.cal.frameDurationMs);
        if (this.player && this.walkState.isWalking) {
          setCharacterWalkPose(this.player, this.walkState.currentWalkDir, this.walkState);
        }
      };
      setVal('lab-fps-val', 1000 / this.cal.frameDurationMs);
    }

    if (mv) {
      mv.value = String(this.cal.moveSpeed);
      setVal('lab-move-speed-val', this.cal.moveSpeed, 1);
      mv.oninput = () => {
        this.cal.moveSpeed = parseFloat(mv.value);
        setVal('lab-move-speed-val', this.cal.moveSpeed, 1);
      };
    }

    document.getElementById('lab-play-walk')?.addEventListener('click', () => {
      if (this.player) setCharacterWalkPose(this.player, 'SE', this.walkState);
    });
    document.getElementById('lab-play-idle')?.addEventListener('click', () => {
      if (this.player) setCharacterIdlePose(this.player, this.hasIdleTexture, this.walkState);
    });
  }

  private applyCalibration() {
    if (!this.player) return;
    applyCharacterCalibration(this.player, this.cal);
    this.drawPivot();
  }

  private drawPivot() {
    if (!this.player || !this.pivotMarker) return;
    const { x, y } = this.player;
    this.pivotMarker.clear();
    this.pivotMarker.lineStyle(2, 0xffee00, 0.9);
    this.pivotMarker.strokeCircle(x, y, 5);
  }

  private moveWithDirection(dx: number, dy: number): void {
    if (!this.player || (dx === 0 && dy === 0)) return;
    const dir = pickWalkDirection(dx, dy);
    setCharacterWalkPose(this.player, dir, this.walkState);
    this.tryStep(dx, dy);
  }

  private tryStep(dx: number, dy: number): void {
    if (!this.player || (dx === 0 && dy === 0)) return;
    const nx = Phaser.Math.Clamp(this.player.x + dx, 16, 1008);
    const ny = Phaser.Math.Clamp(this.player.y + dy, 16, 752);
    this.player.setPosition(nx, ny);
    this.drawPivot();
  }

  private updateKeyboard(): void {
    let mx = 0;
    let my = 0;
    if (this.cursors.left?.isDown) mx -= this.cal.moveSpeed;
    if (this.cursors.right?.isDown) mx += this.cal.moveSpeed;
    if (this.cursors.up?.isDown) my -= this.cal.moveSpeed;
    if (this.cursors.down?.isDown) my += this.cal.moveSpeed;

    if (mx === 0 && my === 0) {
      if (this.player && this.walkState.isWalking) {
        setCharacterIdlePose(this.player, this.hasIdleTexture, this.walkState);
      }
      return;
    }

    this.followPointer = false;
    this.moveToActive = false;
    const delta = isoDelta(mx, my);
    this.moveWithDirection(delta.x, delta.y);
  }

  private updateMoveTo(): void {
    if (!this.player || !this.moveToActive) return;

    const dx = this.moveToX - this.player.x;
    const dy = this.moveToY - this.player.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.arriveDistance) {
      this.moveToActive = false;
      setCharacterIdlePose(this.player, this.hasIdleTexture, this.walkState);
      return;
    }

    this.moveWithDirection((dx / dist) * this.cal.moveSpeed, (dy / dist) * this.cal.moveSpeed);
  }

  private updatePointerFollow(): void {
    if (!this.player || !this.followPointer) return;

    const dx = this.followX - this.player.x;
    const dy = this.followY - this.player.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 2) {
      if (this.walkState.isWalking) {
        setCharacterIdlePose(this.player, this.hasIdleTexture, this.walkState);
      }
      return;
    }

    this.moveWithDirection((dx / dist) * this.cal.moveSpeed, (dy / dist) * this.cal.moveSpeed);
  }

  update() {
    if (!this.player || !this.cursors) return;

    const keys =
      this.cursors.left?.isDown ||
      this.cursors.right?.isDown ||
      this.cursors.up?.isDown ||
      this.cursors.down?.isDown;

    if (keys) {
      this.updateKeyboard();
      return;
    }

    if (this.followPointer) {
      this.updatePointerFollow();
    } else if (this.moveToActive) {
      this.updateMoveTo();
    }
  }
}
