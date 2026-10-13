import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const ROUTES = {
  '/': 'index.html',
  '/about': 'about.html',
  '/projects': 'projects/index.html',
  '/projects/': 'projects/index.html',
  '/projects/pythia-160m': 'projects/pythia-160m/index.html',
  '/projects/codesensei': 'projects/codesensei/index.html',
  '/projects/ledgerlens': 'projects/ledgerlens/index.html',
  '/projects/talktoweb': 'projects/talktoweb/index.html',
  '/research': 'research.html',
  '/interests': 'interests.html',
  '/resume': 'resume.html',
  '/contact': 'contact.html',
  '/lore': 'lore.html',
  '/404': '404.html'
};

async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  // Handle API routes
  if (pathname === '/api/contact') {
    try {
      const { default: contactHandler } = await import('./api/contact.js');
      req.body = await parseBody(req);
      const customRes = {
        status(code) { res.statusCode = code; return this; },
        setHeader(name, val) { res.setHeader(name, val); return this; },
        json(data) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        end() { res.end(); }
      };
      return await contactHandler(req, customRes);
    } catch (err) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  if (pathname === '/api/chat') {
    try {
      const { default: chatHandler } = await import('./api/chat.js');
      req.body = await parseBody(req);
      const customRes = {
        status(code) { res.statusCode = code; return this; },
        setHeader(name, val) { res.setHeader(name, val); return this; },
        json(data) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        end() { res.end(); }
      };
      return await chatHandler(req, customRes);
    } catch (err) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // Handle Clean Route Mappings
  let relativePath = ROUTES[pathname];

  if (!relativePath) {
    // Check if it matches a static file directly
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const candidate = path.join(__dirname, safePath);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      relativePath = path.relative(__dirname, candidate);
    }
  }

  if (!relativePath) {
    // Route to 404
    relativePath = '404.html';
    res.statusCode = 404;
  }

  const filePath = path.join(__dirname, relativePath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Portfolio dev server running at http://localhost:${PORT}/`);
});
