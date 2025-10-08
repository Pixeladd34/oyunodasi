"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";

type PlayerInfo = { id: string; name: string };

type Side = "left" | "right";

type GameState = {
  ballX: number;
  ballY: number;
  velX: number;
  velY: number;
  leftY: number;
  rightY: number;
  leftId: string | null;
  rightId: string | null;
  started: boolean;
};

const WIDTH = 960;
const HEIGHT = 540;
const PADDLE_H = 100;
const PADDLE_W = 14;
const BALL = 14;
const SPEED = 6;

export default function PongScreen() {
  const serverUrl = useMemo(() => process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000", []);
  const [_, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [roomCode, setRoomCode] = useState<string>("");
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Side>>({});
  const [state, setState] = useState<GameState>({ ballX: WIDTH/2, ballY: HEIGHT/2, velX: 4, velY: 3, leftY: HEIGHT/2 - PADDLE_H/2, rightY: HEIGHT/2 - PADDLE_H/2, leftId: null, rightId: null, started: false });
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const s = io(serverUrl, { transports: ["websocket"] });
    setSocket(s);

    s.on("connect", () => {
      s.emit("screen:createRoom", {}, (res: { ok: boolean; code?: string }) => {
        if (res.ok && res.code) setRoomCode(res.code);
      });
    });

    s.on("room:players", (list: Array<{ id: string; name: string }>) => {
      const mapped = list.map(p => ({ id: p.id as string, name: p.name as string }));
      setPlayers(mapped);
      // Otomatik atama: ilk iki oyuncu paddles
      setAssignments(prev => {
        const next = { ...prev } as Record<string, Side>;
        const ids = mapped.map(p => p.id);
        if (!Object.values(next).includes("left") && ids[0]) next[ids[0]] = "left";
        if (!Object.values(next).includes("right") && ids[1]) next[ids[1]] = "right";
        return next;
      });
    });

    s.on("screen:input", (payload: { from: string; type: "dpad" | "action"; data?: { dir?: "up" | "down" | "left" | "right"; btn?: "A" | "B" } }) => {
      setState(cur => {
        // A ile baslat/durdur, B ile reset
        if (payload.type === "action") {
          if (payload.data?.btn === "A") {
            return { ...cur, started: !cur.started };
          }
          if (payload.data?.btn === "B") {
            return { ...cur, ballX: WIDTH/2, ballY: HEIGHT/2, velX: 4, velY: 3, started: false };
          }
        }

        const side = assignments[payload.from];
        if (!side) return cur;
        let next = { ...cur } as GameState;
        if (payload.type === "dpad") {
          const dir = payload.data?.dir;
          if (side === "left") {
            if (dir === "up") next.leftY -= SPEED;
            if (dir === "down") next.leftY += SPEED;
          }
          if (side === "right") {
            if (dir === "up") next.rightY -= SPEED;
            if (dir === "down") next.rightY += SPEED;
          }
        }
        next.leftY = Math.max(0, Math.min(next.leftY, HEIGHT - PADDLE_H));
        next.rightY = Math.max(0, Math.min(next.rightY, HEIGHT - PADDLE_H));
        return next;
      });
    });

    return () => { s.disconnect(); };
  }, [serverUrl, assignments]);

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const loop = () => {
      setState(cur => {
        if (!cur.started) return cur;
        let { ballX, ballY, velX, velY, leftY, rightY } = cur;
        ballX += velX; ballY += velY;
        if (ballY <= 0 || ballY + BALL >= HEIGHT) velY *= -1;
        // sol paddle carpismasi
        if (ballX <= PADDLE_W && ballY + BALL >= leftY && ballY <= leftY + PADDLE_H) {
          velX = Math.abs(velX);
        }
        // sag paddle carpismasi
        if (ballX + BALL >= WIDTH - PADDLE_W && ballY + BALL >= rightY && ballY <= rightY + PADDLE_H) {
          velX = -Math.abs(velX);
        }
        // skor reset
        if (ballX < -50 || ballX > WIDTH + 50) {
          ballX = WIDTH/2; ballY = HEIGHT/2; velX = Math.sign(velX) * -4; velY = 3;
        }
        return { ...cur, ballX, ballY, velX, velY };
      });
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <main style={{display:"grid",placeItems:"center",minHeight:"100svh",fontFamily:"ui-sans-serif, system-ui",padding:16}}>
      <h1 style={{margin:0,fontSize:28}}>Pong (Oda: {roomCode || "..."})</h1>
      <div style={{position:"relative", width: WIDTH, maxWidth: "95vw", aspectRatio:"16/9", border:"2px solid #111", borderRadius:12, background:"#0a0a0a", overflow:"hidden"}}>
        {!state.started && (
          <div style={{position:"absolute", inset:0, display:"grid", placeItems:"center", color:"#999", fontSize:14}}>
            Kumandadan <b>A</b>&#39;ya basarak başlatın — <b>B</b> ile reset
          </div>
        )}
        {/* orta cizgi */}
        <div style={{position:"absolute", left:"50%", top:0, bottom:0, width:2, background:"rgba(255,255,255,.1)"}} />
        {/* sol paddle */}
        <div style={{position:"absolute", left:0, top: state.leftY, width:PADDLE_W, height:PADDLE_H, background:"white", borderTopRightRadius:8, borderBottomRightRadius:8}} />
        {/* sag paddle */}
        <div style={{position:"absolute", right:0, top: state.rightY, width:PADDLE_W, height:PADDLE_H, background:"white", borderTopLeftRadius:8, borderBottomLeftRadius:8}} />
        {/* top */}
        <div style={{position:"absolute", left: state.ballX, top: state.ballY, width:BALL, height:BALL, background:"#22c55e", borderRadius:999}} />
      </div>
      <div style={{marginTop:12, display:"flex", gap:8}}>
        {players.map(p => (
          <div key={p.id} style={{border:"1px solid #ddd", padding:"6px 10px", borderRadius:10}}>
            {p.name} — {assignments[p.id] || "beklemede"}
          </div>
        ))}
      </div>
    </main>
  );
}
