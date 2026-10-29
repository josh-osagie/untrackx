import { build as viteBuild } from 'vite';
import { build as esbuild } from 'esbuild';
import { resolve } from 'path';

async function main() {
  console.log('Building UntrackX Extension...\n');

  // 1. Build Popup via Vite (processes HTML, CSS, assets & copies public/manifest.json)
  console.log('[1/3] Building Popup & Assets with Vite...');
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
  console.log('\n[2/3] Bundling Background Service Worker...');
  await esbuild({
    entryPoints: ['src/background.ts'],
    outfile: 'dist/background.js',
    bundle: true,
    format: 'esm',
    target: 'chrome110',
    sourcemap: false,
    minify: false
  });

  // 3. Build Content Script (IIFE format - isolated without external imports)
  console.log('\n[3/3] Bundling Content Script (IIFE)...');
  await esbuild({
    entryPoints: ['src/content.ts'],
    outfile: 'dist/content.js',
    bundle: true,
    format: 'iife',
    target: 'chrome110',
    sourcemap: false,
    minify: false
  });

  console.log('\n✅ Build complete! Production extension bundle ready in /dist');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
