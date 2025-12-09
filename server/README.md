Proxy server for embedding uploads

This small Express proxy fetches files from your backend and streams them without adding X-Frame-Options or CSP that would block embedding.

Install:

```
cd server
npm init -y
npm install express node-fetch
```

Run:

```
UPSTREAM=http://localhost:4000 PORT=5000 node proxy.js
```

Then use iframe src: `http://localhost:5000/proxy/uploads/Ashwini_OnePager.pdf` from your frontend origin.

Notes:
- Keep this proxy internal to your network; streaming arbitrary external content can be a security risk.
- If you control the backend, prefer setting Content-Security-Policy / X-Frame-Options to allow your frontend origin instead of running a proxy.