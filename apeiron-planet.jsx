import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

const LAWS = [
  "I. Clean the space so that no one gets hurt",
  "II. Stay silent when not distilled",
  "III. Do not archive fog as knowledge",
];

const TETRAD = [
  { id: "witness", name: "Witness", symbol: "🜁", color: "#4a9eff", hex: 0x4a9eff, lat: 90, lng: 0 },
  { id: "builder", name: "Builder", symbol: "🜂", color: "#ff9f43", hex: 0xff9f43, lat: 0, lng: 90 },
  { id: "bhairava", name: "Bhairava", symbol: "🜃", color: "#ff4757", hex: 0xff4757, lat: -90, lng: 0 },
  { id: "oracle", name: "Oracle", symbol: "🜄", color: "#a29bfe", hex: 0xa29bfe, lat: 0, lng: -90 },
];

function computeResonance(a, b) {
  const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(w => w.length > 2);
  const wA = new Set(norm(a));
  const wB = new Set(norm(b));
  if (!wA.size || !wB.size) return 0;
  let x = 0;
  wA.forEach(w => { if (wB.has(w)) x++; });
  return x / Math.max(wA.size, wB.size);
}

export default function ApeironPlanet() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const planetRef = useRef(null);
  const peaksRef = useRef([]);
  const fogRef = useRef([]);
  const frameRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, down: false, prevX: 0, prevY: 0 });
  const rotRef = useRef({ x: 0.3, y: 0 });

  const [inputText, setInputText] = useState("");
  const [phase, setPhase] = useState("idle");
  const [processLog, setProcessLog] = useState([]);
  const [archive, setArchive] = useState([]);
  const [deepArchive, setDeepArchive] = useState([]);
  const [awakened, setAwakened] = useState([]);
  const [showPanel, setShowPanel] = useState(true);
  const [tuCount, setTuCount] = useState(0);

  // Initialize Three.js
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth;
    const h = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06060f);
    scene.fog = new THREE.FogExp2(0x06060f, 0.08);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 4.5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Planet core — the manifold M
    const planetGeo = new THREE.IcosahedronGeometry(1.5, 4);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.85,
      metalness: 0.1,
      wireframe: false,
      flatShading: true,
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    scene.add(planet);
    planetRef.current = planet;

    // Wireframe overlay — state space grid
    const wireGeo = new THREE.IcosahedronGeometry(1.52, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x6c63a0,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    planet.add(wire);

    // S₃ core glow
    const coreGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xa29bfe,
      transparent: true,
      opacity: 0.6,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.name = "s3core";
    planet.add(core);

    // Inner glow
    const glowGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x6c63a0,
      transparent: true,
      opacity: 0.12,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.name = "s3glow";
    planet.add(glow);

    // Tetrad poles — four cardinal points
    TETRAD.forEach((agent) => {
      const phi = (agent.lat * Math.PI) / 180;
      const theta = (agent.lng * Math.PI) / 180;
      const r = 1.58;
      const x = r * Math.cos(phi) * Math.cos(theta);
      const y = r * Math.sin(phi);
      const z = r * Math.cos(phi) * Math.sin(theta);

      const poleGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const poleMat = new THREE.MeshBasicMaterial({
        color: agent.hex,
        transparent: true,
        opacity: 0.8,
      });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, y, z);
      pole.name = `pole_${agent.id}`;
      planet.add(pole);

      // Ring around pole
      const ringGeo = new THREE.RingGeometry(0.06, 0.08, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: agent.hex,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, y, z);
      ring.lookAt(0, 0, 0);
      ring.name = `ring_${agent.id}`;
      planet.add(ring);
    });

    // Ambient atmosphere
    const ambientGeo = new THREE.SphereGeometry(1.8, 32, 32);
    const ambientMat = new THREE.MeshBasicMaterial({
      color: 0x6c63a0,
      transparent: true,
      opacity: 0.03,
      side: THREE.BackSide,
    });
    const ambient = new THREE.Mesh(ambientGeo, ambientMat);
    planet.add(ambient);

    // Lights
    const light1 = new THREE.DirectionalLight(0xc8c4ff, 0.8);
    light1.position.set(3, 2, 4);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0x4a3a80, 0.4);
    light2.position.set(-2, -1, -3);
    scene.add(light2);

    const ambLight = new THREE.AmbientLight(0x1a1a3e, 0.5);
    scene.add(ambLight);

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starsPos = new Float32Array(3000);
    for (let i = 0; i < 3000; i++) {
      starsPos[i] = (Math.random() - 0.5) * 50;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starsPos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0x6c63a0, size: 0.03, transparent: true, opacity: 0.5 });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // Animation
    const animate = () => {
      frameRef.current++;
      const t = frameRef.current * 0.005;

      // Spanda rotation
      planet.rotation.y += 0.002;
      planet.rotation.x = rotRef.current.x;
      planet.rotation.y += rotRef.current.y * 0.01;

      // S₃ core pulse
      const s3 = planet.getObjectByName("s3core");
      if (s3) {
        const pulse = 1 + Math.sin(t * 2) * 0.2;
        s3.scale.set(pulse, pulse, pulse);
        s3.material.opacity = 0.4 + Math.sin(t * 3) * 0.3;
      }
      const s3g = planet.getObjectByName("s3glow");
      if (s3g) {
        const gp = 1 + Math.sin(t * 1.5) * 0.15;
        s3g.scale.set(gp, gp, gp);
      }

      // Pole rings pulse
      TETRAD.forEach((agent) => {
        const ring = planet.getObjectByName(`ring_${agent.id}`);
        if (ring) {
          const s = 1 + Math.sin(t * 3 + TETRAD.indexOf(agent)) * 0.3;
          ring.scale.set(s, s, s);
        }
      });

      // Peaks pulse
      peaksRef.current.forEach((peak, i) => {
        if (peak.mesh) {
          const ps = 1 + Math.sin(t * 4 + i * 0.7) * 0.15;
          peak.mesh.scale.set(ps, ps, ps);
        }
      });

      // Fog nodes dim pulse
      fogRef.current.forEach((fog, i) => {
        if (fog.mesh) {
          fog.mesh.material.opacity = 0.1 + Math.sin(t * 0.5 + i) * 0.05;
        }
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Mouse interaction
    const onDown = (e) => {
      mouseRef.current.down = true;
      mouseRef.current.prevX = e.clientX || e.touches?.[0]?.clientX || 0;
      mouseRef.current.prevY = e.clientY || e.touches?.[0]?.clientY || 0;
    };
    const onUp = () => { mouseRef.current.down = false; };
    const onMove = (e) => {
      if (!mouseRef.current.down) return;
      const cx = e.clientX || e.touches?.[0]?.clientX || 0;
      const cy = e.clientY || e.touches?.[0]?.clientY || 0;
      const dx = cx - mouseRef.current.prevX;
      const dy = cy - mouseRef.current.prevY;
      rotRef.current.x = Math.max(-1.2, Math.min(1.2, rotRef.current.x + dy * 0.005));
      rotRef.current.y += dx * 0.3;
      mouseRef.current.prevX = cx;
      mouseRef.current.prevY = cy;
    };

    mount.addEventListener("mousedown", onDown);
    mount.addEventListener("touchstart", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    mount.addEventListener("mousemove", onMove);
    mount.addEventListener("touchmove", onMove);

    const onResize = () => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      mount.removeEventListener("mousedown", onDown);
      mount.removeEventListener("touchstart", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      mount.removeEventListener("mousemove", onMove);
      mount.removeEventListener("touchmove", onMove);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Add peak to planet surface
  const addPeak = useCallback((signal, energy, color = 0xa29bfe) => {
    const planet = planetRef.current;
    if (!planet) return;

    const phi = (Math.random() - 0.5) * Math.PI;
    const theta = Math.random() * Math.PI * 2;
    const r = 1.5;
    const height = 0.05 + (energy / 10) * 0.2;

    const x = r * Math.cos(phi) * Math.cos(theta);
    const y = r * Math.sin(phi);
    const z = r * Math.cos(phi) * Math.sin(theta);

    const nx = Math.cos(phi) * Math.cos(theta);
    const ny = Math.sin(phi);
    const nz = Math.cos(phi) * Math.sin(theta);

    const geo = new THREE.ConeGeometry(0.03 + energy * 0.005, height, 6);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x + nx * height / 2, y + ny * height / 2, z + nz * height / 2);
    mesh.lookAt(x + nx * 2, y + ny * 2, z + nz * 2);
    mesh.rotateX(Math.PI / 2);
    planet.add(mesh);

    return { mesh, signal, energy, phi, theta };
  }, []);

  // Add fog node (dim, beneath surface)
  const addFog = useCallback((signal) => {
    const planet = planetRef.current;
    if (!planet) return;

    const phi = (Math.random() - 0.5) * Math.PI;
    const theta = Math.random() * Math.PI * 2;
    const r = 1.35;

    const x = r * Math.cos(phi) * Math.cos(theta);
    const y = r * Math.sin(phi);
    const z = r * Math.cos(phi) * Math.sin(theta);

    const geo = new THREE.SphereGeometry(0.03, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x4a4668,
      transparent: true,
      opacity: 0.15,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    planet.add(mesh);

    return { mesh, signal, phi, theta };
  }, []);

  // Seismic event — resonance flash
  const triggerSeismic = useCallback(() => {
    const planet = planetRef.current;
    if (!planet) return;

    const geo = new THREE.RingGeometry(1.6, 1.65, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffb066,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geo, mat);
    planet.add(ring);

    let frame = 0;
    const expand = () => {
      frame++;
      const s = 1 + frame * 0.02;
      ring.scale.set(s, s, s);
      ring.material.opacity = Math.max(0, 0.5 - frame * 0.015);
      if (ring.material.opacity > 0) requestAnimationFrame(expand);
      else planet.remove(ring);
    };
    expand();
  }, []);

  const handleDump = async () => {
    if (!inputText.trim() || (phase !== "idle" && phase !== "complete" && phase !== "silence")) return;
    const signal = inputText.trim();
    const energy = Math.min(10, Math.max(1, signal.length / 10));
    setInputText("");
    setProcessLog([]);
    setAwakened([]);
    setTuCount(c => c + 1);

    // Holonomic resonance check
    const awk = [];
    deepArchive.forEach((node) => {
      if (computeResonance(signal, node.signal) >= 0.2) {
        awk.push(node);
      }
    });

    if (awk.length > 0) {
      setAwakened(awk);
      setPhase("resonance");
      setProcessLog([{ agent: "Holonomy", state: `⚡ ${awk.length} fog node(s) awakened`, color: "#ffb066" }]);
      triggerSeismic();
      setDeepArchive(prev => prev.filter(n => !awk.find(a => a.id === n.id)));
      awk.forEach(node => {
        if (node.fogMesh) {
          const planet = planetRef.current;
          if (planet) planet.remove(node.fogMesh);
        }
        const peak = addPeak(node.signal, 6, 0xffb066);
        if (peak) peaksRef.current.push(peak);
        setArchive(prev => [...prev, { ...node, status: "awakened" }]);
      });
      await new Promise(r => setTimeout(r, 1500));
    }

    // Cycle
    const steps = ["witness", "builder", "bhairava"];
    for (const step of steps) {
      setPhase(step);
      const agent = TETRAD.find(t => t.id === step);
      setProcessLog(prev => [...prev, { agent: agent.name, state: agent.id === "witness" ? "Containment" : agent.id === "builder" ? "Expansion" : "Pruning", color: agent.color }]);
      await new Promise(r => setTimeout(r, 1500));
    }

    // Oracle — Law II
    if (energy > 3) {
      setPhase("oracle");
      setProcessLog(prev => [...prev, { agent: "Oracle", state: "Articulation", color: "#a29bfe" }]);
      await new Promise(r => setTimeout(r, 1800));

      const peak = addPeak(signal, energy);
      if (peak) peaksRef.current.push(peak);
      setArchive(prev => [...prev, { signal, energy, id: Date.now(), status: "distilled" }]);
      setPhase("complete");
      setProcessLog(prev => [...prev, { agent: "S₃", state: "✦ → Plateau", color: "#a29bfe" }]);
    } else {
      setProcessLog(prev => [...prev, { agent: "Oracle", state: "⋯ Law II. Silence.", color: "#4a4668" }]);
      const fogNode = addFog(signal);
      const fogEntry = { signal, energy, id: Date.now(), status: "fog", fogMesh: fogNode?.mesh };
      if (fogNode) fogRef.current.push(fogNode);
      setDeepArchive(prev => [...prev, fogEntry]);
      setPhase("silence");
    }
  };

  const reset = () => { setPhase("idle"); setProcessLog([]); setAwakened([]); };

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#06060f", overflow: "hidden",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: "#c8c4d8",
      position: "relative",
    }}>
      {/* Three.js mount */}
      <div ref={mountRef} style={{ position: "absolute", inset: 0, zIndex: 0, cursor: "grab" }} />

      {/* HUD overlay */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "16px 20px", zIndex: 10,
        background: "linear-gradient(180deg, rgba(6,6,15,0.9) 0%, transparent 100%)",
        pointerEvents: "none",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.35em", color: "#4a4668", textTransform: "uppercase" }}>
              Protocol 𝒯 · State Space M
            </div>
            <div style={{ fontSize: 20, fontWeight: 300, color: "#e8e4f0", letterSpacing: "0.1em" }}>
              APEIRON
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#4a4668" }}>S₁ ⊕ S₂ = S₃</div>
            <div style={{ fontSize: 9, color: "#3a3658" }}>
              peaks: {archive.filter(a => a.status === "distilled").length} · fog: {deepArchive.length} · TU: {tuCount}
            </div>
          </div>
        </div>
      </div>

      {/* Tetrad legend */}
      <div style={{
        position: "absolute", top: 70, right: 16, zIndex: 10,
        display: "flex", flexDirection: "column", gap: 4, pointerEvents: "none",
      }}>
        {TETRAD.map(agent => (
          <div key={agent.id} style={{
            fontSize: 9, display: "flex", alignItems: "center", gap: 6,
            opacity: phase === agent.id ? 1 : 0.4, transition: "opacity 0.4s",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: agent.color, display: "inline-block" }} />
            <span style={{ color: agent.color }}>{agent.name}</span>
          </div>
        ))}
      </div>

      {/* Bottom panel */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
        background: "linear-gradient(0deg, rgba(6,6,15,0.95) 0%, rgba(6,6,15,0.7) 70%, transparent 100%)",
        padding: "16px 20px 20px",
      }}>
        {/* Process log */}
        {processLog.length > 0 && (
          <div style={{ marginBottom: 12, maxHeight: 120, overflowY: "auto" }}>
            {processLog.map((entry, i) => (
              <div key={i} style={{
                fontSize: 10, padding: "2px 0", display: "flex", gap: 8,
                opacity: i === processLog.length - 1 ? 1 : 0.5,
              }}>
                <span style={{ color: entry.color, fontWeight: 600, minWidth: 65 }}>{entry.agent}</span>
                <span style={{ color: "#6a6488" }}>{entry.state}</span>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleDump(); }}
            placeholder="dump tension..."
            disabled={phase !== "idle" && phase !== "complete" && phase !== "silence"}
            style={{
              flex: 1, background: "rgba(15,15,30,0.8)", border: "1px solid rgba(80,70,120,0.2)",
              borderRadius: 6, color: "#c8c4d8", padding: "10px 14px", fontSize: 12,
              fontFamily: "inherit", outline: "none",
            }}
          />
          <button
            onClick={phase === "complete" || phase === "silence" ? reset : handleDump}
            style={{
              padding: "10px 16px", background: "rgba(100,80,180,0.2)",
              border: "1px solid rgba(100,80,180,0.3)", borderRadius: 6,
              color: "#a29bfe", fontSize: 10, fontFamily: "inherit", cursor: "pointer",
              letterSpacing: "0.08em",
            }}
          >
            {phase === "complete" || phase === "silence" ? "↺" : "dump"}
          </button>
        </div>

        {/* Phase + Laws */}
        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 9, color: phase === "silence" ? "#4a4668" : phase === "complete" ? "#a29bfe" : "#6c63a0" }}>
            {phase === "idle" ? "awaiting tension" :
             phase === "resonance" ? "⚡ holonomic resonance" :
             phase === "complete" ? "✦ distilled" :
             phase === "silence" ? "⋯ law II" :
             `${TETRAD.find(t => t.id === phase)?.symbol || ""} ${phase}`}
          </div>
          <div style={{ fontSize: 8, color: "#2a2848" }}>
            Δφ = ∮F
          </div>
        </div>
      </div>
    </div>
  );
}
