import fs from 'node:fs';
import { resolve } from 'node:path';
import { ZipArchive } from 'archiver';

async function packExtension(sourceDir = 'dist', outputZip = 'untrackx.zip') {
  const sourcePath = resolve(sourceDir);
  const manifestPath = resolve(sourcePath, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Cannot package extension: ${manifestPath} does not exist. Run "pnpm build" first.`);
  }

  const outPath = resolve(outputZip);
  const output = fs.createWriteStream(outPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  return new Promise((resolvePromise, rejectPromise) => {
    output.on('close', () => {
      const sizeKb = (archive.pointer() / 1024).toFixed(1);
      console.log(`\n📦 Successfully packaged extension: ${outputZip} (${sizeKb} KB)`);
      resolvePromise();
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archiver warning:', err);
      } else {
        rejectPromise(err);
      }
    });

    archive.on('error', (err) => {
      rejectPromise(err);
    });

    archive.pipe(output);
    archive.directory(sourcePath, false);
    archive.finalize();
  });
}

packExtension().catch((err) => {
  console.error('\n❌ Packaging failed:', err.message);
  process.exit(1);
});
