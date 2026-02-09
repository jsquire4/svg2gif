#!/usr/bin/env node

const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = isNaN(next) ? next : Number(next);
        i++;
      } else {
        args[key] = true;
      }
    } else if (!args.input) {
      args.input = arg;
    }
  }
  return args;
}

async function svgToGif(opts = {}) {
  const {
    input     = 'seismic_wave.svg',
    output    = null,
    width     = 3840,
    height    = 2160,
    fps       = 20,
    duration  = 6,
    delay     = 1000,
    colors    = 64,
    framesDir = '.svg2gif-frames',
  } = opts;

  const outputPath = output || path.basename(input, path.extname(input)) + '.gif';
  const totalFrames = fps * duration;
  const inputPath = path.resolve(input);

  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Input:    ${inputPath}`);
  console.log(`Output:   ${outputPath}`);
  console.log(`Viewport: ${width}x${height}`);
  console.log(`Capture:  ${totalFrames} frames at ${fps}fps (${duration}s)`);
  console.log(`Palette:  ${colors} colors`);
  console.log('');

  if (fs.existsSync(framesDir)) {
    fs.rmSync(framesDir, { recursive: true });
  }
  fs.mkdirSync(framesDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(`file://${inputPath}`);
  await new Promise(r => setTimeout(r, delay));

  for (let i = 0; i < totalFrames; i++) {
    await page.screenshot({
      path: path.join(framesDir, `frame_${String(i).padStart(4, '0')}.png`),
    });
    const pct = Math.round((i / totalFrames) * 100);
    process.stdout.write(`\rCapturing: ${pct}% (${i + 1}/${totalFrames})`);
    await new Promise(r => setTimeout(r, 1000 / fps));
  }
  console.log('\nStitching GIF...');

  await browser.close();

  const cmd = `ffmpeg -y -framerate ${fps} -i ${framesDir}/frame_%04d.png -vf "split[s0][s1];[s0]palettegen=max_colors=${colors}[p];[s1][p]paletteuse=dither=bayer" "${outputPath}"`;
  execSync(cmd, { stdio: 'inherit' });

  // Cleanup frames
  fs.rmSync(framesDir, { recursive: true });

  const size = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`Done: ${outputPath} (${size}MB)`);
}

const args = parseArgs(process.argv);

if (args.help) {
  console.log(`
svg2gif - Convert animated SVGs to GIFs

Usage:
  svg2gif <input.svg> [options]

Options:
  --output <file>     Output filename (default: <input>.gif)
  --width <n>         Viewport width (default: 3840)
  --height <n>        Viewport height (default: 2160)
  --fps <n>           Frames per second (default: 20)
  --duration <n>      Capture duration in seconds (default: 6)
  --delay <n>         Wait before capturing in ms (default: 1000)
  --colors <n>        Max GIF palette colors (default: 64)
  --help              Show this help

Examples:
  svg2gif seismic_wave.svg
  svg2gif seismic_wave.svg --fps 30 --duration 8
  svg2gif my_anim.svg --output cool.gif --colors 128
  svg2gif seismic_crt.svg --width 1920 --height 1080
`);
  process.exit(0);
}

svgToGif(args);
