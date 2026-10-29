import { build as viteBuild } from 'vite';
import { build as esbuild } from 'esbuild';
import { resolve } from 'path';

async function main() {
  console.log('Building UntrackX Extension...\n');

  // 1. Build Popup via Vite (processes HTML, CSS, assets & copies public/manifest.json)
  console.log('[1/4] Building Popup & Assets with Vite...');
  await viteBuild({
    configFile: false,
    publicDir: 'public',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve('popup.html')
        },
        output: {
          entryFileNames: 'popup.js',
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    }
  });

  // 2. Build Background Service Worker (ES Module format for MV3)
  console.log('\n[2/4] Bundling Background Service Worker...');
  await esbuild({
    entryPoints: ['src/background.ts'],
    outfile: 'dist/background.js',
    bundle: true,
    format: 'esm',
    target: 'chrome111',
    sourcemap: false,
    minify: false
  });

  // 3. Build Content Script (IIFE format - runs in ISOLATED world)
  console.log('\n[3/4] Bundling Content Script (IIFE)...');
  await esbuild({
    entryPoints: ['src/content.ts'],
    outfile: 'dist/content.js',
    bundle: true,
    format: 'iife',
    target: 'chrome111',
    sourcemap: false,
    minify: false
  });

  // 4. Build Interceptor Script (IIFE format - runs in MAIN world)
  console.log('\n[4/4] Bundling Interceptor Script (IIFE)...');
  await esbuild({
    entryPoints: ['src/interceptor.ts'],
    outfile: 'dist/interceptor.js',
    bundle: true,
    format: 'iife',
    target: 'chrome111',
    sourcemap: false,
    minify: false
  });

  console.log('\n✅ Build complete! Production extension bundle ready in /dist');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
