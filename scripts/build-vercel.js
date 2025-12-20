import { mkdirSync, cpSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Create Vercel output structure
const outputDir = join(root, '.vercel/output');
const staticDir = join(outputDir, 'static');
const functionsDir = join(outputDir, 'functions/index.func');

// Clean and create directories
mkdirSync(staticDir, { recursive: true });
mkdirSync(functionsDir, { recursive: true });

// Copy client assets to static
cpSync(join(root, 'dist/client'), staticDir, { recursive: true });

// Create function entry point source
const serverPath = join(root, 'dist/server/server.js').replace(/\\/g, '/');
const functionEntry = `
import server from '${serverPath}';

export default async function handler(req, res) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const url = new URL(req.url, \`\${protocol}://\${host}\`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
    duplex: 'half',
  });

  try {
    const response = await server.fetch(request);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });

    const body = await response.arrayBuffer();
    res.send(Buffer.from(body));
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Internal Server Error');
  }
}
`;

// Write temporary entry file
const tempEntry = join(root, '.vercel-entry.js');
writeFileSync(tempEntry, functionEntry);

// Bundle with esbuild
await build({
  entryPoints: [tempEntry],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: join(functionsDir, 'index.mjs'),
  external: [],
  minify: false,
  sourcemap: false,
  banner: {
    js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
  },
});

// Clean up temp file
import { unlinkSync } from 'fs';
unlinkSync(tempEntry);

// Create function config
const funcConfig = {
  runtime: 'nodejs20.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
};
writeFileSync(join(functionsDir, '.vc-config.json'), JSON.stringify(funcConfig, null, 2));

// Create output config
const outputConfig = {
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index' },
  ],
};
writeFileSync(join(outputDir, 'config.json'), JSON.stringify(outputConfig, null, 2));

console.log('Vercel build output created successfully!');
