import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { registerEvents } from './events.js';
import { EventStore } from './store.js';

const PORT = Number(process.env.PORT) || 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: true, methods: ['GET', 'POST'] },
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + '/index.html');
})

const store = new EventStore();

registerEvents(io, store);

server.listen(PORT, () => {
  console.log('Сервак стартанул');
});
