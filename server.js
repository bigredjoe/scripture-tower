// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Serve Vite build output
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Scripture Tower listening on port ' + listener.address().port);
});
