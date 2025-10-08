"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import io from "socket.io-client";

type Dpad = "up" | "down" | "left" | "right";

export default function Oyun3DPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [roomCode, setRoomCode] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const serverUrl = useMemo(() => process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000", []);

  useEffect(() => {
    const socket = io(serverUrl);
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("screen:createRoom", {}, (res: { ok: boolean; code?: string; reason?: string }) => {
        if (res.ok && res.code) setRoomCode(res.code);
        else setError(res.reason || "oda oluşturulamadı");
      });
    });
    socket.on("connect_error", (e) => setError(e.message));

    // 3B sahne
    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 2.4, 6);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(4, 8, 6);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.2, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x22c55e })
    );
    cube.position.y = 0.5;
    scene.add(cube);

    const speed = 0.08;
    socket.on("screen:input", (payload: { type: "dpad" | "action"; data?: { dir?: Dpad; btn?: "A" | "B" } }) => {
      if (payload.type === "dpad") {
        const dir = payload.data?.dir;
        if (dir === "left") cube.position.x -= speed;
        if (dir === "right") cube.position.x += speed;
        if (dir === "up") cube.position.z -= speed;
        if (dir === "down") cube.position.z += speed;
      }
      if (payload.type === "action") {
        if (payload.data?.btn === "A") cube.position.y = 1.5;
        if (payload.data?.btn === "B") cube.rotation.y += Math.PI / 4;
      }
    });

    let raf: number | null = null;
    const loop = () => {
      cube.position.y += (0.5 - cube.position.y) * 0.08; // basit yerçekimi dönüşü
      cube.rotation.x += 0.01;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => {
      if (!mount) return;
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      socket.disconnect();
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [serverUrl]);

  return (
    <main style={{display:"grid",justifyItems:"center",gap:12,minHeight:"100svh",fontFamily:"ui-sans-serif, system-ui",padding:16}}>
      <h1 style={{margin:0,fontSize:28}}>3B Oyun</h1>
      <p style={{margin:0}}>
        Oda: <b style={{letterSpacing:4}}>{roomCode || "..."}</b>
        <span style={{marginLeft:8,fontSize:12,color:"#666"}}>{connected ? "bağlı" : "bağlanıyor"}{error ? ` — hata: ${error}` : ""}</span>
      </p>
      <div ref={mountRef} style={{width:"min(960px, 92vw)", aspectRatio:"16/9", border:"2px solid #111", borderRadius:12, overflow:"hidden"}} />
      <div style={{fontSize:12,color:"#666"}}>Kumandadan yön tuşları, A: zıpla, B: döndür</div>
    </main>
  );
}


