// Simple proxy to stream files from an upstream backend and remove frame-blocking headers.
// Usage: node proxy.js
// Requirements: npm install express node-fetch

const express = require('express');
const fetch = require('node-fetch');
const app = express();

const UPSTREAM = process.env.UPSTREAM;
const PORT = process.env.PORT || 5000;

if (!UPSTREAM) {
  console.error('UPSTREAM environment variable is required');
  process.exit(1);
}

app.get('/proxy/uploads/*', async (req, res) => {
  try {
    const path = req.params[0]; // wildcard
    const remoteUrl = `${UPSTREAM}/uploads/${path}`;
    const upstreamResp = await fetch(remoteUrl);

    // copy essential headers but avoid X-Frame-Options or CSP that blocks embedding
    const contentType = upstreamResp.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    const contentDisposition = upstreamResp.headers.get('content-disposition');
    if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);

    // Do NOT set X-Frame-Options or frame-ancestors that block embedding
    // Stream the body
    res.status(upstreamResp.status);
    upstreamResp.body.pipe(res);
  } catch (err) {
    console.error('proxy error', err);
    res.status(502).send('Bad Gateway');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy listening on http://localhost:${PORT}`);
  console.log(`Proxying /proxy/uploads/* -> ${UPSTREAM}/uploads/*`);
});
