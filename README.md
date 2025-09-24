# Aurora Isles – Three.js Open World Explorer

Aurora Isles is a WebGL-powered open world sandbox built with [Three.js](https://threejs.org/). Explore hand-crafted islands shaped by procedural noise, discover campfires that flicker through the night, and wander beneath aurora curtains and a dynamic sky that transitions from day to night in real-time.

## Features

- 🌄 **Procedural terrain** with soft height transitions, colored biomes, and ambient fog.
- 🌲 **Dense forests and rocky outcrops** generated with lightweight instancing techniques.
- 🔥 **Interactive atmosphere** including dancing aurora veils, dynamic campfires, emissive lighting, and a full day/night cycle.
- 🧭 **Pointer lock exploration** featuring WASD controls, sprinting, and jumping across the rugged landscape.

## Getting Started

This project has no build step. You only need a static file server that can host ES modules (for example `npx http-server`).

```bash
# Install http-server globally or use npx
npx http-server .

# Open the URL printed in the terminal (defaults to http://127.0.0.1:8080)
```

Once the page loads, click anywhere in the viewport to lock the pointer and begin exploring. Press <kbd>Esc</kbd> to release the cursor.

## Controls

| Action | Input |
| ------ | ----- |
| Move | <kbd>W</kbd>/<kbd>A</kbd>/<kbd>S</kbd>/<kbd>D</kbd> or Arrow Keys |
| Sprint | Hold <kbd>Shift</kbd> |
| Jump | <kbd>Space</kbd> |
| Look | Move the mouse (pointer lock) |

## Project Structure

```
index.html          # Entry point with overlay UI and canvas styling
src/
  main.js           # Scene setup, render loop, and sky shader
  controls/
    Player.js       # Pointer lock controller with physics and collision
  world/
    Terrain.js      # Procedural noise-based terrain generator
    World.js        # Environment composition (trees, water, lights)
```

Feel free to tweak the terrain settings inside `src/world/Terrain.js` to generate new islands or adjust biome colors.
