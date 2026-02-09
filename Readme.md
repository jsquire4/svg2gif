# svg2gif

Convert animated SVGs to GIFs. Uses headless Chromium (via Puppeteer) to capture frames and ffmpeg to stitch them.

## Install

```bash
npm install -g .
```

Or clone and link:

```bash
git clone <repo-url>
cd svg2gif
npm install
npm link
```

## Usage

```bash
svg2gif <input.svg> [options]
```

Viewport dimensions are automatically read from the SVG's `width`/`height` attributes or `viewBox`. CLI flags override if specified.

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--output <file>` | `<input>.gif` | Output filename |
| `--width <n>` | from SVG | Viewport width |
| `--height <n>` | from SVG | Viewport height |
| `--fps <n>` | 20 | Frames per second |
| `--duration <n>` | 6 | Capture duration in seconds |
| `--delay <n>` | 1000 | Wait before capturing (ms) |
| `--colors <n>` | 64 | Max GIF palette colors |

### Examples

```bash
# Basic — reads dimensions from the SVG
svg2gif animation.svg

# Higher framerate, longer capture
svg2gif animation.svg --fps 30 --duration 8

# Force specific resolution
svg2gif animation.svg --width 1920 --height 1080

# More colors for smoother gradients (larger file)
svg2gif animation.svg --output smooth.gif --colors 128
```

## How it works

1. Launches headless Chromium and loads the SVG
2. Waits for animations to initialize
3. Captures PNG frames at the specified FPS
4. Stitches frames into a GIF using ffmpeg with optimized palette generation
5. Cleans up temp frames

Both Puppeteer (Chromium) and ffmpeg are bundled as npm dependencies — no system installs required.

## License

MIT