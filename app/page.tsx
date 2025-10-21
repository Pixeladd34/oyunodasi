"use client";
import { useEffect, useState } from "react";

type Shot = {
  id: string;
  device_id: string;
  file_url: string;
  hostname: string | null;
  created_at: string;
};

export default function Home() {
  const [items, setItems] = useState<Shot[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fetchLatest = async () => {
      const r = await fetch("/api/latest", { cache: "no-store" });
      const j = await r.json();
      setItems(j);
    };
    fetchLatest();
    const t = setInterval(() => setTick((x) => x + 1), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/latest", { cache: "no-store" });
      setItems(await r.json());
    })();
  }, [tick]);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Cihaz Ekranları</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {items.map((x) => (
          <div key={x.id} style={{ border: "1px solid #ddd", padding: 8, borderRadius: 8, background: '#fff' }}>
            <div style={{ fontSize: 12, marginBottom: 6 }}>
              {x.device_id} {x.hostname ? `(${x.hostname})` : ""} — {new Date(x.created_at).toLocaleTimeString()}
            </div>
            <img src={x.file_url} alt={x.device_id} style={{ width: "100%", borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

