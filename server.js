import express from 'express';
import { WebSocketServer } from 'ws';
import { bibleLookup } from "./server/bible.js";
import { openUserFiles } from './server/other.js';
import { remoteQr } from "./server/remote.js"
import { checkUpdate, downloadUpdate } from './server/update.js';
import { listFiles, getFile, putFile, deleteFile } from './server/files.js';
const app = express();
app.port = 3000;

app.use('/version.json', express.static('version.json'));
app.use(
    express.raw({
        inflate: true,
        limit: '10mb',
        type: () => true,
    })
);

app.get('/api', (req, res) => res.send("Church Presenter API"));
app.get('/api/bible-lookup', bibleLookup);
app.get('/api/remote-qr', remoteQr);
app.get('/api/update/check', checkUpdate);
app.get('/api/update/download', downloadUpdate);
app.get('/api/open-user-files', openUserFiles);
app.get('/api/files/:folder', listFiles);
app.get('/api/files/:folder/:name', getFile);
app.put('/api/files/:folder/:name', putFile);
app.delete('/api/files/:folder/:name', deleteFile);

const server = app.listen(app.port);

const wss = new WebSocketServer({ server, clientTracking: true });
wss.shouldHandle = req => {
    let url = new URL(req.url, `ws://${req.headers.host}`);
    return url.pathname.match(/\/ws\/(presenter|remote|slideshow)/);
}

wss.on('connection', (ws, req) => {
    let url = new URL(req.url, `http://${req.headers.host}`);
    ws.origin = url.pathname.replace("/ws/","");

    ws.on('error', console.error);
  
    ws.on('message', data => {
        let {dest, message} = JSON.parse(data);
        wss.clients.forEach(client => {
            if (client.origin === dest) {
                client.send(JSON.stringify({origin: ws.origin, message}))
            }
        })
    });
});