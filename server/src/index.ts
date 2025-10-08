import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as IOServer, Socket } from 'socket.io';

// Oda ve oyuncu durum saklama
type Player = {
  controllerId: string;
  socketId: string | null;
  name: string;
  device: 'screen' | 'controller';
};

type Room = {
  code: string;
  screenSocketId: string | null;
  players: Record<string, Player>; // key: controllerId
};

const rooms: Record<string, Room> = {};
const socketContext: Record<string, { code: string; role: 'screen' | 'controller'; controllerId?: string }> = {};

function generateRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new IOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket: Socket) => {
  // Ekran oda olusturur
  socket.on('screen:createRoom', (_payload, cb: (res: { ok: boolean; code?: string; reason?: string }) => void) => {
    const code = generateRoomCode();
    rooms[code] = { code, screenSocketId: socket.id, players: {} };
    socket.join(code);
    socketContext[socket.id] = { code, role: 'screen' };
    cb({ ok: true, code });
  });

  // Kumanda odaya katilir (veya yeniden baglanir)
  socket.on(
    'controller:joinRoom',
    (
      payload: { code: string; name?: string; controllerId?: string },
      cb: (res: { ok: boolean; reason?: string }) => void
    ) => {
      const code = payload.code?.toUpperCase?.();
      const room = code && rooms[code];
      if (!room) return cb({ ok: false, reason: 'Oda bulunamadı' });
      if (!room.screenSocketId) return cb({ ok: false, reason: 'Ekran bagli degil' });

      const controllerId = (payload.controllerId || '').trim() || socket.id; // yedek olarak mevcut socket id
      const name = payload.name || 'Oyuncu';

      const existing = room.players[controllerId];
      if (existing) {
        existing.socketId = socket.id;
        existing.name = name || existing.name;
      } else {
        room.players[controllerId] = {
          controllerId,
          socketId: socket.id,
          name,
          device: 'controller',
        };
      }

      socket.join(code);
      socketContext[socket.id] = { code, role: 'controller', controllerId };

      // Ekrana guncel oyuncu listesini gonder (UI beklentisi: id alani olsun)
      const list = Object.values(room.players).map((p) => ({ id: p.controllerId, name: p.name, device: p.device }));
      io.to(code).emit('room:players', list);
      cb({ ok: true });
    }
  );

  // Ekrana kumanda girdileri
  socket.on('controller:input', (_payload: { code?: string; type: string; data?: unknown }) => {
    const ctx = socketContext[socket.id];
    if (!ctx || ctx.role !== 'controller') return;
    const room = rooms[ctx.code];
    if (!room || !room.screenSocketId) return;

    io.to(room.screenSocketId).emit('screen:input', {
      from: ctx.controllerId,
      type: _payload.type,
      data: _payload.data,
    });
  });

  socket.on('disconnect', () => {
    const ctx = socketContext[socket.id];

    // Tum odalarda oyuncu veya ekran kopmasi kontrolu
    for (const code of Object.keys(rooms)) {
      const room = rooms[code];
      if (!room) continue;

      if (room.screenSocketId === socket.id) {
        // ekran ayrildi, odayi kapat
        io.to(code).emit('room:closed');
        delete rooms[code];
        continue;
      }
    }

    if (ctx?.role === 'controller' && ctx.controllerId && rooms[ctx.code]) {
      const room = rooms[ctx.code]!;
      const player = room.players[ctx.controllerId];
      if (player) {
        // oyuncuyu silmek yerine baglantisini bosalt (kisa sureli kopmalarda yeniden baglanabilsin)
        player.socketId = null;
        const list = Object.values(room.players).map((p) => ({ id: p.controllerId, name: p.name, device: p.device }));
        io.to(ctx.code).emit('room:players', list);
      }
    }

    delete socketContext[socket.id];
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] calisiyor http://localhost:${PORT}`);
});
