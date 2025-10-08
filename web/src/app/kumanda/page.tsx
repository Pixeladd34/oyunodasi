"use client";
import { useEffect, useMemo, useState } from "react";
import io, { Socket } from "socket.io-client";

function getOrCreateControllerId() {
  if (typeof window === "undefined") return "";
  const key = "controllerId";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

export default function KumandaPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const serverUrl = useMemo(() => process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000", []);

  useEffect(() => {
    const s = io(serverUrl);
    setSocket(s);
    return () => { s.disconnect(); };
  }, [serverUrl]);

  useEffect(() => {
    // URL parametresinden code ön-doldurma
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    const c = u.searchParams.get("code");
    if (c) setCode(c.toUpperCase());
  }, []);

  function join() {
    if (!socket) return;
    const controllerId = getOrCreateControllerId();
    socket.emit("controller:joinRoom", { code, name, controllerId }, (res: { ok: boolean; reason?: string }) => {
      if (res.ok) {
        // sessionStorage.setItem("lastRoomCode", code);
        setJoined(true);
      } else alert(res.reason || "Baglanilamadi");
    });
  }

  function send(type: "dpad" | "action", data?: { dir?: "up" | "down" | "left" | "right"; btn?: "A" | "B" }) {
    if (!socket || !joined) return;
    socket.emit("controller:input", { code, type, data });
    if (navigator.vibrate) navigator.vibrate(10);
  }

  return (
    <main style={{display:"grid",placeItems:"center",minHeight:"100svh",fontFamily:"ui-sans-serif, system-ui",padding:16}}>
      {!joined ? (
        <div style={{display:"grid",gap:12,width:"min(420px, 100%)"}}>
          <h1 style={{margin:0,fontSize:28}}>Kumanda</h1>
          <label style={{display:"grid",gap:6}}>
            <span>Oda Kodu</span>
            <input value={code} onChange={(e)=>setCode(e.target.value.toUpperCase())} placeholder="ABCDE" style={{padding:10,border:"1px solid #ccc",borderRadius:8,fontSize:18,letterSpacing:4,textTransform:"uppercase"}}/>
          </label>
          <label style={{display:"grid",gap:6}}>
            <span>İsim (opsiyonel)</span>
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Oyuncu" style={{padding:10,border:"1px solid #ccc",borderRadius:8,fontSize:18}}/>
          </label>
          <button onClick={join} style={{padding:12,border:"none",borderRadius:8,background:"black",color:"white",fontSize:18}}>Katıl</button>
        </div>
      ) : (
        <div style={{display:"grid",gap:16,width:"min(480px,100%)"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            <button onClick={()=>send("dpad", {dir:"up"})} style={{gridColumn:"2",padding:18,borderRadius:12,fontSize:18}}>⬆️</button>
            <button onClick={()=>send("dpad", {dir:"left"})} style={{gridColumn:"1",padding:18,borderRadius:12,fontSize:18}}>⬅️</button>
            <button onClick={()=>send("dpad", {dir:"right"})} style={{gridColumn:"3",padding:18,borderRadius:12,fontSize:18}}>➡️</button>
            <button onClick={()=>send("dpad", {dir:"down"})} style={{gridColumn:"2",padding:18,borderRadius:12,fontSize:18}}>⬇️</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button onClick={()=>send("action", {btn:"A"})} style={{padding:16,borderRadius:12,fontSize:18,background:"#0ea5e9",color:"white"}}>A</button>
            <button onClick={()=>send("action", {btn:"B"})} style={{padding:16,borderRadius:12,fontSize:18,background:"#f59e0b",color:"white"}}>B</button>
          </div>
        </div>
      )}
    </main>
  );
}
