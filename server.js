const http = require('http');
const fs = require('fs');
const path = require('path');

const PRIMARY_PORT = parseInt(process.env.PORT, 10) || 3000;
const SECONDARY_PORT = parseInt(process.env.SECONDARY_PORT, 10) || 0;
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT, 10) || 4001;
const STATIC_HOST = process.env.STATIC_HOST || '127.0.0.1';
const BASE_DIR = fs.realpathSync(__dirname);
const PUBLIC_FILES = new Set(['index.html', 'dashboard.html']);
const PUBLIC_DIRECTORIES = ['auth-app/dist', 'js'];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function isWithinBaseDirectory(candidatePath) {
  const relativePath = path.relative(BASE_DIR, candidatePath);
  return relativePath === '' || (
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

function isAllowedPublicPath(candidatePath) {
  const relativePath = path.relative(BASE_DIR, candidatePath).split(path.sep).join('/');
  return PUBLIC_FILES.has(relativePath) || PUBLIC_DIRECTORIES.some((directory) => (
    relativePath.startsWith(`${directory}/`)
  ));
}

function resolveRequestPath(requestPath) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch (error) {
    return null;
  }

  try {
    const candidatePath = path.resolve(BASE_DIR, `.${decodedPath}`);
    return isWithinBaseDirectory(candidatePath) ? candidatePath : null;
  } catch (error) {
    return null;
  }
}

function resolvePublicFile(candidatePath) {
  if (!candidatePath) return null;
  try {
    const realPath = fs.realpathSync(candidatePath);
    if (!isWithinBaseDirectory(realPath) || !isAllowedPublicPath(realPath) || !fs.statSync(realPath).isFile()) return null;
    return realPath;
  } catch (error) {
    return null;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function requestHandler(req, res) {
  res.setHeader('Cache-Control', 'no-cache');

  // Keep browser API calls same-origin during local development. The API itself
  // runs as a separate service so the static prototype remains independently usable.
  if (req.url.startsWith('/api/v1/')) {
    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${BACKEND_PORT}` }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      }
      res.end(JSON.stringify({ error: 'api_unavailable', message: 'SeatSwap API is not running.' }));
    });

    req.pipe(proxyReq);
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqPath = req.url.split('?')[0];

  // Handle any nested dashboard.html requests (e.g. /auth-app/dist/dashboard.html)
  if (reqPath !== '/dashboard.html' && (reqPath.endsWith('/dashboard.html') || reqPath.endsWith('/dashboard'))) {
    res.writeHead(302, { 'Location': '/dashboard.html' });
    res.end();
    return;
  }

  // Keep public auth aliases in sync with the auth app's HashRouter routes.
  const authRouteAliases = {
    '/login': '/login',
    '/signup': '/signup',
    '/reset-password': '/reset-password',
    '/verify-email': '/verify-email',
    '/profile': '/profile'
  };
  if (authRouteAliases[reqPath]) {
    res.writeHead(302, { 'Location': `/auth-app/dist/index.html#${authRouteAliases[reqPath]}` });
    res.end();
    return;
  }

  // Handle any nested index.html requests (except auth-app)
  if (reqPath !== '/index.html' && reqPath !== '/auth-app/dist/index.html' && reqPath !== '/auth-app/index.html' && (reqPath.endsWith('/index.html') || reqPath.endsWith('/index') || reqPath.endsWith('/home'))) {
    res.writeHead(302, { 'Location': '/index.html' });
    res.end();
    return;
  }

  // Route aliases
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/dashboard.html';
  } else if (reqPath === '/dashboard') {
    reqPath = '/dashboard.html';
  } else if (reqPath === '/index' || reqPath === '/home') {
    reqPath = '/index.html';
  } else if (
    reqPath === '/auth' ||
    reqPath === '/auth-app' ||
    reqPath === '/auth-app/' ||
    reqPath === '/auth-app/index.html' ||
    reqPath === '/auth-app/dist' ||
    reqPath === '/auth-app/dist/'
  ) {
    reqPath = '/auth-app/dist/index.html';
  }

  // Handle asset requests (/assets/... -> auth-app/dist/assets/...)
  if (reqPath.startsWith('/assets/')) {
    const directPath = resolveRequestPath(reqPath);
    if (!resolvePublicFile(directPath)) {
      const authAssetPath = resolveRequestPath(`/auth-app/dist${reqPath}`);
      const safeAuthAssetPath = resolvePublicFile(authAssetPath);
      if (safeAuthAssetPath) {
        serveFile(safeAuthAssetPath, res);
        return;
      }
    }
  }

  let filePath = resolveRequestPath(reqPath);
  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  let safeFilePath = resolvePublicFile(filePath);
  if (!safeFilePath) {
    // Try adding .html, but still require the result to resolve inside the public root.
    safeFilePath = resolvePublicFile(`${filePath}.html`);
  }
  if (!safeFilePath) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <div style="font-family:sans-serif; text-align:center; padding:40px;">
        <h1>404 Not Found</h1>
        <p>Path not found: <code>${escapeHtml(reqPath)}</code></p>
        <div style="margin-top:20px;">
          <a href="/dashboard.html" style="margin:0 10px; color:#ffbe0b;">📊 SeatSwap Dashboard</a>
          <a href="/index.html" style="margin:0 10px; color:#ffbe0b;">🏠 Landing Page</a>
          <a href="/auth-app/dist/index.html#/login" style="margin:0 10px; color:#ffbe0b;">🔑 Sign In</a>
        </div>
      </div>
    `);
    return;
  }

  serveFile(safeFilePath, res);
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

// Start primary server on PORT (e.g. 3000)
const primaryServer = http.createServer(requestHandler);
primaryServer.listen(PRIMARY_PORT, STATIC_HOST, () => {
  console.log(`\n======================================================`);
  console.log(`⚡  SeatSwap prototype server running`);
  console.log(`======================================================`);
  console.log(`  👉 Dashboard:    http://localhost:${PRIMARY_PORT}/dashboard.html`);
  console.log(`  👉 Landing Page: http://localhost:${PRIMARY_PORT}/index.html`);
  console.log(`  👉 Auth App:     http://localhost:${PRIMARY_PORT}/auth-app/dist/index.html`);
  console.log(`======================================================\n`);
});

// Start an optional mirror only when explicitly configured.
if (SECONDARY_PORT > 0 && SECONDARY_PORT !== PRIMARY_PORT) {
  const secondaryServer = http.createServer(requestHandler);
  secondaryServer.on('error', (err) => {
    // Port 8080 might be in use, ignore error
  });
  secondaryServer.listen(SECONDARY_PORT, STATIC_HOST, () => {
    console.log(`  🔗 Also mirrored on: http://localhost:${SECONDARY_PORT}/\n`);
  });
}
