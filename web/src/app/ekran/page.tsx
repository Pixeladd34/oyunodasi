"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import QRCode from "qrcode";

type Player = { id: string; name: string; device: "screen" | "controller" };

type Actor = { x: number; y: number; color: string };

type DpadData = { dir: "up" | "down" | "left" | "right" };
type ActionData = { btn: "A" | "B" };
type ScreenInput =
  | { from: string; type: "dpad"; data: DpadData }
  | { from: string; type: "action"; data: ActionData };

const COLORS = ["#ef4444","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ec4899"]; 

export default function EkranPage() {
  const [roomCode, setRoomCode] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [connError, setConnError] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [actors, setActors] = useState<Record<string, Actor>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const serverUrl = useMemo(() => process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000", []);

  useEffect(() => {
    const s = io(serverUrl, { transports: ["websocket"] });

    s.on("connect", () => {
      setConnected(true);
      s.emit("screen:createRoom", {}, (res: { ok: boolean; code?: string; reason?: string }) => {
        if (res.ok && res.code) setRoomCode(res.code);
      });
    });

    s.on("connect_error", (err) => {
      setConnError(err?.message || "Bağlantı hatası");
    });

    s.on("room:players", (list: Player[]) => {
      setPlayers(list);
      setActors(prev => {
        const next: Record<string, Actor> = { ...prev };
        // yeni oyunculara renk ve pozisyon ata
        list.forEach((p, idx) => {
          if (!next[p.id]) {
            next[p.id] = { x: 50 + idx * 30, y: 50 + idx * 20, color: COLORS[idx % COLORS.length] };
          }
        });
        // ayrilanlari temizle
        Object.keys(next).forEach(id => {
          if (!list.find(p => p.id === id)) delete next[id];
        });
        return next;
      });
    });

    s.on("screen:input", (payload: ScreenInput) => {
      setActors(prev => {
        const cur = prev[payload.from];
        if (!cur) return prev;
        const speed = 8;
        let { x, y } = cur;
        if (payload.type === "dpad") {
          const dir = payload.data.dir;
          if (dir === "up") y -= speed;
          if (dir === "down") y += speed;
          if (dir === "left") x -= speed;
          if (dir === "right") x += speed;
        }
        if (payload.type === "action") {
          // A/B icin minik bir ziplama efekti
          if (payload.data.btn === "A") y -= speed * 2;
          if (payload.data.btn === "B") x += speed * 2;
        }
        const bounds = containerRef.current?.getBoundingClientRect();
        const maxX = (bounds?.width ?? 800) - 24;
        const maxY = (bounds?.height ?? 480) - 24;
        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));
        return { ...prev, [payload.from]: { ...cur, x, y } };
      });
    });

    s.on("room:closed", () => {
      setRoomCode("");
      setPlayers([]);
      setActors({});
    });

    return () => {
      s.disconnect();
    };
  }, [serverUrl]);

  useEffect(() => {
    // oda kodu geldiğinde QR üret
    if (!roomCode || !qrCanvasRef.current) return;
    const url = `${window.location.origin}/kumanda?code=${roomCode}`;
    QRCode.toCanvas(qrCanvasRef.current, url, { width: 128, margin: 1 }, (err) => {
      if (err) setConnError(err.message);
    });
  }, [roomCode]);

  const grid = useMemo(() => ({ cols: 24, rows: 14 }), []);

  const renderActors = useCallback(() => {
    return Object.entries(actors).map(([id, a]) => (
      <div key={id} style={{position:"absolute", transform:`translate(${a.x}px, ${a.y}px)`, width:24, height:24, background:a.color, borderRadius:6, boxShadow:"0 2px 6px rgba(0,0,0,.15)"}} />
    ));
  }, [actors]);

  return (
    <main style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,minHeight:"100svh",fontFamily:"ui-sans-serif, system-ui",padding:16}}>
      <h1 style={{fontSize:36,margin:0}}>Ekran</h1>
      <p style={{fontSize:18}}>
        Bu kod ile katılın:
        <span style={{marginLeft:8,fontSize:12,color:"#666"}}>
          {connected ? "bağlı" : "bağlanıyor"}
          {connError ? ` — hata: ${connError}` : ""}
        </span>
      </p>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{fontSize:54,fontWeight:700,letterSpacing:6,fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",padding:"6px 14px",border:"2px dashed #111",borderRadius:12,background:"#fff"}}>
          {roomCode || "..."}
        </div>
        <canvas ref={qrCanvasRef} style={{border:"1px solid #ddd",borderRadius:8, background:"white"}} />
      </div>
      <div style={{marginTop:6,fontSize:12,color:"#666"}}>sunucu: {serverUrl}</div>
      <div ref={containerRef} style={{position:"relative",marginTop:16,width:"min(960px, 90vw)",height:"min(540px, 56vw)",border:"2px solid #111",borderRadius:12,backgroundImage:"linear-gradient(0deg, rgba(0,0,0,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.03) 1px, transparent 1px)", backgroundSize:`calc(100%/${grid.cols}) calc(100%/${grid.rows})`, overflow:"hidden"}}>
        {renderActors()}
      </div>
      <div style={{marginTop:12,width:"min(960px, 90vw)"}}>
        <h2 style={{fontSize:20,margin:"12px 0"}}>Oyuncular</h2>
        <ul style={{listStyle:"none", padding:0, margin:0, display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))", gap:8}}>
          {players.map((p, idx) => (
            <li key={p.id} style={{border:"1px solid #ddd",borderRadius:8,padding:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{display:"inline-block",width:12,height:12,background:COLORS[idx % COLORS.length],borderRadius:4}} />
                <strong>{p.name}</strong>
              </div>
              <div style={{fontSize:12,color:"#666"}}>#{p.id.slice(0,4)}</div>
            </li>
          ))}
        </ul>
      </div>
      <p style={{marginTop:8}}>Telefonunuzdan <strong>/kumanda</strong> sayfasına gidip oda kodunu girin.</p>
    </main>
  );
}
