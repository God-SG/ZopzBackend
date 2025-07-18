const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const videoDir = path.join(__dirname, '/videos');
const logFile = path.join(__dirname, 'logs.txt');

app.use(express.static(path.join(__dirname, 'public')));

// Serve homepage with video list
app.get('/', (req, res) => {
  const files = fs.readdirSync(videoDir).filter(file =>
    file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.webm')
  );

  let videoListHTML = files.map(file => {
    return `<li><a href="/watch/${encodeURIComponent(file)}">${file}</a></li>`;
  }).join('');

  fs.readFile(path.join(__dirname, '/index.html'), 'utf8', (err, html) => {
    if (err) return res.status(500).send('Page Error');
    html = html.replace('<!--VIDEO_LIST-->', videoListHTML);
    res.send(html);
  });
});

// Watch route with IP logging
app.get('/watch/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(videoDir, filename);

  if (!fs.existsSync(filePath)) return res.status(404).send('Video not found');

  // Log IP + time
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const timestamp = new Date().toLocaleString();
  fs.appendFileSync(logFile, `${ip} - ${timestamp} - ${filename}\n`);

  fs.readFile(path.join(__dirname, '/watch.html'), 'utf8', (err, html) => {
    if (err) return res.status(500).send('Page Error');
    html = html.replace('%%FILENAME%%', filename);
    res.send(html);
  });
});

// Serve videos
app.use('/videos', express.static(videoDir));

app.listen(PORT, () => {
  console.log(`🌐 Mini Streamable Site running at http://localhost:${PORT}`);
});
