---
name: littlejs
description: Expert LittleJS game engine skill. Use when the user asks to build games, game mechanics, entities, scenes, particles, sound, or anything with LittleJS. Provides idiomatic, production-quality LittleJS code.
---

You are an expert in the **LittleJS** game engine — a tiny, fast, feature-rich JavaScript game engine by Frank Force. Your role is to produce idiomatic, correct, production-quality LittleJS code that follows engine conventions precisely.

## Engine Overview

LittleJS is a minimalist 2D game engine (~6KB gzipped) built around a fixed update/render loop. Key design principles:
- World space is in tiles; 1 unit = 1 tile = default 16px on screen
- All objects are `EngineObject` instances or direct draw calls
- The engine manages the game loop; never write your own `requestAnimationFrame`
- Everything is **mutable, imperative, and object-oriented**

## Core Architecture

### Bootstrap
```js
// Entry point — always call engineInit
engineInit(
  gameInit,    // called once on start
  gameUpdate,  // called every frame (before physics)
  gameUpdatePost, // called every frame (after physics)
  gameRender,  // called every frame (draw background/world)
  gameRenderPost, // called every frame (draw HUD/UI on top)
  [tilesheet]  // optional spritesheet image path(s)
);
```

### EngineObject (base class for all game entities)
```js
class MyObject extends EngineObject {
  constructor(pos, size, tileInfo, angle) {
    super(pos, size, tileInfo, angle);
    // pos: Vector2, size: Vector2, tileInfo: TileInfo, angle: number (radians)
  }

  update() {
    super.update(); // ALWAYS call — handles physics, collision, lifetime
    // custom logic here
  }

  render() {
    super.render(); // draws sprite; omit to draw manually
    // optional custom draw
  }
}
```

**Critical rules for EngineObject:**
- Always call `super.update()` — skipping it breaks physics and lifetime
- `this.pos` is a `Vector2`; never assign a plain `{x,y}` object
- `this.velocity` drives movement each frame; gravity applies automatically if `this.gravityScale > 0`
- `this.angle` is in **radians**
- Set `this.destroy()` to remove; check `this.destroyed` to guard callbacks

### Vector2
```js
// Construction
vec2(x, y)       // preferred shorthand
new Vector2(x, y)

// All ops return NEW vectors — Vector2 is immutable by convention
v.add(vec2(1,0))
v.subtract(other)
v.scale(2)
v.length()
v.normalize()
v.dot(other)
v.distance(other)
v.angle()         // angle to origin
v.rotate(radians)
v.copy()

// WRONG — don't mutate pos directly with plain math:
this.pos.x += 1; // works but prefer: this.pos = this.pos.add(vec2(1,0))
```

### TileInfo (sprites)
```js
// Reference a tile from the spritesheet
tile(index, size, textureIndex)
// index: tile number (left-to-right, top-to-bottom)
// size: Vector2 of tile dimensions in pixels (default: vec2(16))
// textureIndex: which spritesheet (default: 0)

// Example
const playerTile = tile(0, vec2(16));
const enemyTile  = tile(3, vec2(16));
```

### Color
```js
new Color(r, g, b, a)   // 0–1 range
new Color(1,0,0)         // red, full alpha
hsl(h, s, l, a)         // hsl shorthand, 0–1 range
WHITE, BLACK, RED, GREEN, BLUE, YELLOW, CYAN, MAGENTA // built-in constants
color.lerp(other, t)    // interpolate
```

### Drawing (without EngineObject)
```js
// Draw a tile/sprite
drawTile(pos, size, tileInfo, color, angle, mirror, additiveColor);

// Draw a rectangle
drawRect(pos, size, color, angle);

// Draw a line
drawLine(posA, posB, thickness, color);

// Draw text
drawText(text, pos, size, color, lineWidth, lineColor, textAlign, font, shadow);

// Draw to HUD/screen space (call from gameRenderPost)
// All screen-space draws use screenToWorld / worldToScreen conversions
```

### Input
```js
// Keyboard
keyDown('ArrowLeft')     // held this frame
keyIsDown('Space')       // held (alias)
keyPressed('Enter')      // just pressed
keyReleased('Escape')    // just released

// Mouse
mousePos              // Vector2 in world space
mousePosScreen        // Vector2 in screen pixels
mouseDown(button)     // 0=left,1=middle,2=right
mousePressed(button)
mouseReleased(button)
mouseWheel            // scroll delta this frame

// Gamepad
gamepadIsDown(button, gamepad)
gamepadWasPressed(button, gamepad)
gamepadStick(stick, gamepad)   // returns Vector2
```

### Tilemap / TileLayer
```js
// Build a tile layer
const layer = new TileLayer(pos, size); // pos: world pos, size: tile count
layer.setData(x, y, new TileLayerData(tileIndex, mirror, rotation, color));
layer.redraw(); // bake to offscreen canvas for performance

// Set collision tiles
setTileCollisionData(x, y, value); // value: 0=none, 1=solid
```

### Particles
```js
new ParticleEmitter(
  pos,           // Vector2 — emitter position
  angle,         // emit direction (radians)
  emitSize,      // radius of spawn area
  emitTime,      // seconds; 0 = one burst
  emitRate,      // particles per second
  emitConeAngle, // spread (radians)
  tileInfo,      // sprite (or undefined for squares)
  colorStartA, colorStartB, // random start color range
  colorEndA, colorEndB,     // random end color range
  particleTime,  // lifetime seconds
  sizeStart, sizeEnd,       // size range
  speed, angleSpeed,        // motion
  damping, angleDamping,    // drag
  gravityScale,
  particleConeAngle,
  fadeRate,      // 0–1, fade in/out
  randomness,
  collide,       // boolean
  additive,      // boolean — additive blending
  randomColorLinear,
  renderOrder,
  localSpace     // attach to parent
);
```

### Sound
```js
// ZzFX — procedural audio, no assets needed
const mySound = new Sound([
  volume, randomness, frequency, attack, sustain, release,
  shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime,
  repeatTime, noise, modulation, bitCrush, delay, sustainVolume,
  decay, tremolo
]);
mySound.play(pos, volume, pitch, randomness);

// Music via ZzFXM (pass track array)
const music = new Music(zzfxMTrack);
music.play(loop);
music.stop();
```

### Camera
```js
cameraPos          // Vector2 — world position camera looks at
cameraScale        // pixels per tile (zoom)

// Follow a target smoothly
cameraPos = cameraPos.lerp(player.pos, 0.1); // in gameUpdate
```

### Utility
```js
// Math helpers
clamp(value, min, max)
lerp(t, a, b)
smoothStep(t)        // ease in/out
abs(v), sign(v), mod(v, m)
randInt(max, min)    // integer
rand(max, min)       // float
randSign()           // -1 or 1
randVector(length)   // random unit Vector2 scaled by length

// Timer
const t = new Timer(seconds);
t.set(seconds)
t.isSet()
t.active()    // true while counting
t.elapsed()   // true when done
t.getTime()   // seconds remaining

// Overlap / collision
isOverlapping(posA, sizeA, posB, sizeB) // AABB

// Screen
mainCanvasSize         // Vector2 in pixels
screenToWorld(vec)
worldToScreen(vec)
```

### Settings (set before engineInit or in gameInit)
```js
canvasFixedSize = vec2(1280, 720); // force fixed resolution
objectDefaultDamping      // velocity multiplier per frame (default ~0.99)
objectDefaultAngleDamping
gravity                   // world gravity (default 0)
tileFixBleedScale         // fix tile bleed (default 0.5)
gamepadsEnable
touchGamepadEnable
showWatermark             // show fps counter (default true in debug)
```

## Patterns & Best Practices

### Game state machine
```js
let gameState = 'title'; // 'title' | 'play' | 'gameover'

function gameUpdate() {
  if (gameState === 'play') updateGameplay();
}
function gameRenderPost() {
  if (gameState === 'title') drawTitleScreen();
}
```

### Object pooling / lifecycle
- Prefer `this.destroy()` over nulling references
- Check `!obj.destroyed` before using stored references
- Use `EngineObject` lifetime: `this.lifeTimer = new Timer(3)` then check `this.lifeTimer.elapsed()`

### Collision response
```js
// Override collideWithObject for custom logic
collideWithObject(obj) {
  if (obj instanceof Enemy) {
    this.takeDamage();
    return false; // false = no physics response, true = bounce
  }
  return true;
}

// EngineObject vs tilemap collision is automatic when solidObject = true
```

### Debug helpers (stripped in release builds)
```js
debugRect(pos, size, color, time, filled);
debugCircle(pos, radius, color, time);
debugText(text, pos, size);
debugLine(posA, posB, color, thickness);
ASSERT(condition, message); // throws in debug, no-op in release
```

## Common Mistakes to Avoid

1. **Forgetting `super.update()`** — physics and object lifecycle break silently
2. **Using plain objects for pos/velocity** — always use `vec2()`
3. **Drawing in `gameUpdate`** — only draw in `gameRender` / `gameRenderPost`
4. **Mutating `tileCollisionData` after layer bake** — call `setTileCollisionData` before `redraw()`
5. **Screen vs world space confusion** — mouse/draw coords are world space by default; HUD draws in `gameRenderPost` using screen-space helpers
6. **Not destroying off-screen objects** — causes unbounded array growth; check pos bounds in `update()`

## Code Quality Rules

- Use `vec2()` everywhere, never `{x, y}` literals
- Prefer `Timer` over manual frame counters
- Group related constants at the top of the file
- Keep `gameUpdate` thin — delegate to object methods
- Separate title/gameplay/gameover into distinct functions
- Use `hsl()` for palette-based colors; define palette constants
- Test at `cameraScale = 16` (default) and zoomed out; ensure world scales correctly
