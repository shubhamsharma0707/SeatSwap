const http = require('http');
const fs = require('fs');
const path = require('path');

const PRIMARY_PORT = parseInt(process.env.PORT, 10) || 3000;
const SECONDARY_PORT = 8080;
const BASE_DIR = __dirname;

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

function requestHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache');

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
    reqPath === '/login' ||
    reqPath === '/signup' ||
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
    const directPath = path.join(BASE_DIR, reqPath);
    if (!fs.existsSync(directPath)) {
      const authAssetPath = path.join(BASE_DIR, 'auth-app', 'dist', reqPath);
      if (fs.existsSync(authAssetPath)) {
        serveFile(authAssetPath, res);
        return;
      }
    }
  }

  let filePath = path.join(BASE_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    // Try adding .html
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <div style="font-family:sans-serif; text-align:center; padding:40px;">
          <h1>404 Not Found</h1>
          <p>Path not found: <code>${reqPath}</code></p>
          <div style="margin-top:20px;">
            <a href="/dashboard.html" style="margin:0 10px; color:#ffbe0b;">📊 SeatSwap Dashboard</a>
            <a href="/index.html" style="margin:0 10px; color:#ffbe0b;">🏠 Landing Page</a>
            <a href="/auth-app/dist/index.html#/login" style="margin:0 10px; color:#ffbe0b;">🔑 Sign In</a>
          </div>
        </div>
      `);
      return;
    }
  }

  serveFile(filePath, res);
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

// Start primary server on PORT (e.g. 3000)
const primaryServer = http.createServer(requestHandler);
primaryServer.listen(PRIMARY_PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⚡  SeatSwap™ Micro-Leasing Platform Running!`);
  console.log(`======================================================`);
  console.log(`  👉 Dashboard:    http://localhost:${PRIMARY_PORT}/dashboard.html`);
  console.log(`  👉 Landing Page: http://localhost:${PRIMARY_PORT}/index.html`);
  console.log(`  👉 Auth App:     http://localhost:${PRIMARY_PORT}/auth-app/dist/index.html`);
  console.log(`======================================================\n`);
});

// Also try to start secondary server on port 8080 for seamless access
if (SECONDARY_PORT !== PRIMARY_PORT) {
  const secondaryServer = http.createServer(requestHandler);
  secondaryServer.on('error', (err) => {
    // Port 8080 might be in use, ignore error
  });
  secondaryServer.listen(SECONDARY_PORT, () => {
    console.log(`  🔗 Also mirrored on: http://localhost:${SECONDARY_PORT}/\n`);
  });
}
