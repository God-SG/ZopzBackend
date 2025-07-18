
const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const http = require('http');
const fs = require('fs');

const { log } = require('./utils/logger');
const { loadKeys, saveKeys } = require('./utils/filestuff');
const { parse } = require('./utils/json-stuff');
const { IsExpired } = require('./utils/time-stuff'); 

const app = express();

app.get('/', (req, res) => 
{
    return res.send('working');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 8080;
const DB_PATH = './keys.json';
const HEARTBEAT_INTERVAL = 30000;
const TIMEOUT = 30000;

let KEYS = loadKeys(DB_PATH);
let lastKeysData = JSON.stringify(KEYS);

const debounce = (fn, delay) => 
{
  let timeout = null;
  return () => 
  {
    clearTimeout(timeout);
    timeout = setTimeout(fn, delay);
  };
};

const watchKeysFile = debounce(() => 
{
  try 
  {
    const newData = fs.readFileSync(DB_PATH, 'utf8');
    if (newData !== lastKeysData) 
    {
      KEYS = JSON.parse(newData);
      lastKeysData = newData;
      log('[KEYS] Reloaded keys file', 'cyan');
    }
  } 
  catch {}
}, 250);

fs.watch(DB_PATH, watchKeysFile);

const getIP = (req) => 
{
  const raw = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  return raw.startsWith('::ffff:') ? raw.replace('::ffff:', '') : raw;
};

const send = (ws, data) => 
{
  if (ws.readyState === WebSocket.OPEN) 
  {
    ws.send(JSON.stringify(data));
  }
};

const sessions = new Map();
const activeKeys = new Map();

setInterval(() => 
{
  const now = Date.now();
  for (const [sessionKey, session] of sessions.entries()) 
  {
    if (now - session.lastPing > TIMEOUT) 
    {
      log(`Session timeout for key ${session.key} (${session.ip})`, 'yellow');
      session.ws.close(); 
    }
  }
}, HEARTBEAT_INTERVAL);

wss.on('connection', (ws, req) => 
{
    const ip = getIP(req);
    let key = null;
    let hwid = null;
    let authed = false;
    let sessionKey = null;
    let lastPing = Date.now();
    const cleanupSession = () => 
    {
      if (sessionKey) 
      {
        sessions.delete(sessionKey);
        if (key) activeKeys.delete(key);
      }
    }

    log(`Incoming connection from ${ip}`, 'gray');
    send(ws, { type: 'auth_required' });

    ws.on('message', (msg) => 
    {
      const data = parse(msg);
      if (!data) 
      {
        ws.close();
        return;
      }
      if (!authed && data.type === 'auth')
      {
          key = data.key;
          hwid = data.hwid;
          const user = KEYS[key];
          if (!user) 
          {
            send(ws, { type: 'error', message: 'invalid_key' });
            log(`Invalid key attempt from ${ip}`, 'red');
            ws.close();
            return;
          }
          if (user.banned) 
          {
            send(ws, { type: 'error', message: 'key_banned' });
            log(`Banned key used from ${ip}`, 'red');
            ws.close();
            return;
          }
          if (IsExpired(user)) 
          {
            send(ws, { type: 'error', message: 'key_expired' });
            log(`Expired key used from ${ip}`, 'red');
            ws.close();
            return;
          }
          const matchedServer = user.servers.find(srv => srv.address === ip);
          if (!matchedServer) 
          {
            if (user.servers.length >= user.servers_slots) 
            {
              send(ws, { type: 'error', message: 'server_slots_exceeded' });
              log(`Server slots exceeded for key ${key} from ${ip}`, 'red');
              ws.close();
              return;
            }
            user.servers.push({ address: ip, hwid });
            saveKeys(DB_PATH, KEYS);
            log(`New server slot added for key ${key} from ${ip} with HWID ${hwid}`, 'green');
          }
          else 
          {
            if (matchedServer.hwid !== hwid) 
            {
              send(ws, { type: 'error', message: 'hwid_mismatch' });
              log(`HWID mismatch for key ${key} from ${ip}`, 'yellow');
              ws.close();
              return;
            }
            if (activeKeys.has(key)) 
            {
              const existingSessionKey = activeKeys.get(key);
              const existingSession = sessions.get(existingSessionKey);
              if (existingSession?.ws?.readyState === WebSocket.OPEN) 
              {
                send(ws, { type: 'error', message: 'already_active' });
                log(`Multiple session blocked for key ${key}`, 'yellow');
                ws.close();
                return;
              } 
              else 
              {
                sessions.delete(existingSessionKey);
                activeKeys.delete(key);
              }
            }
            authed = true;
            sessionKey = crypto.randomBytes(16).toString('hex');
            lastPing = Date.now();
            sessions.set(sessionKey, { ws, ip, hwid, key, connected: lastPing, lastPing });
            activeKeys.set(key, sessionKey);
            send(ws, { type: 'auth_success' });
            log(`Auth success for key ${key} from ${ip}`, 'green');
            return;
        }

        if (!authed) 
        {
          send(ws, { type: 'error', message: 'auth_required' });
          ws.close();
          return;
        }
      }
    });
    ws.on('ping', () => 
    {
      const session = sessions.get(sessionKey);
      if (session) 
      {
        session.lastPing = Date.now();
      }
      const user = KEYS[key];
      if (user && user?.banned) 
      {
        send(ws, { type: 'error', message: 'key_banned' });
        log(`Banned key detected on ping for ${key}`, 'red');
        ws.close();
        return;
      }
      if (IsExpired(user)) 
      {
        send(ws, { type: 'error', message: 'key_expired' });
        log(`Expired key used from ${ip}`, 'red');
        ws.close();
        return;
      }
      log(`Ping received from ${key || 'unauthenticated'} (${ip})`, 'gray');
    });
    ws.on('close', () => 
    {
      cleanupSession();
      if (authed) 
      {
        log(`Session closed for ${key} (${ip})`, 'gray');
      }
    });
});

server.listen(PORT, () => 
{
  console.clear();
  log(`Auth server running on port ${PORT}`, 'green');
});