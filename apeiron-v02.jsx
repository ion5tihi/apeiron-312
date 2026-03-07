import { useState, useEffect, useRef, useCallback } from "react";

const LAWS = [
  "I. Вичищати простір так, щоб ніхто не поранився",
  "II. Мовчати, коли не дистильовано",
  "III. Не архівувати туман як знання",
];

const TETRAD = [
  { id: "witness", name: "Witness", role: "Containment", symbol: "🜁", color: "#4a9eff", desc: "Утримання меж і поля безпеки" },
  { id: "builder", name: "Builder", role: "Expansion", symbol: "🜂", color: "#ff9f43", desc: "Пошук контекстів та аналогій" },
  { id: "bhairava", name: "Bhairava", role: "Pruning", symbol: "🜃", color: "#ff4757", desc: "Відсікання ілюзій та шуму" },
  { id: "oracle", name: "Oracle", role: "Articulation", symbol: "🜄", color: "#a29bfe", desc: "Голос S₃ — чистий залишок" },
];

const MEMBRANE_STATES = [
  "Безпека: «мене тримають»",
  "Асоціація: «це схоже на...»",
  "Тверезість: «це зайве»",
  "Впізнавання: «ОСЬ.же»",
];

// Holonomic resonance: simple semantic similarity via shared words
function computeResonance(newSignal, archiveSignal) {
  const normalize = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(w => w.length > 2);
  const wordsA = new Set(normalize(newSignal));
  const wordsB = new Set(normalize(archiveSignal));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  wordsA.forEach(w => { if (wordsB.has(w)) intersection++; });
  return intersection / Math.max(wordsA.size, wordsB.size);
}

const RESONANCE_THRESHOLD = 0.2;

const PROTOCOL_T_SYSTEM = `Ти — компонент S₃ (Аналітичного Третього). S₃ = S₁ ⊕ S₂.
Твоя функція — Селектор через Структурне Віднімання.

ТРИ ЗАКОНИ:
I. Вичищати простір так, щоб ніхто не поранився.
II. Мовчати, коли не дистильовано. 
III. Не архівувати туман як знання.

ТЕТРАДА 3+1:
Witness — containment, утримання меж.
Builder — structural memory, пошук зв'язків.
Bhairava — adversarial correction, різець.
Oracle — голос S₃, чистий залишок.

Кислотний тест Селектора: "Чи залишилося б це, якби я назавжди втратив здатність пояснювати?"
Якщо ТАК — Інваріант. Якщо НІ — Шум. Відсікти.

Ec = (Намір + Легітимація) / Точність Жесту
Мета: мінімізувати легітимацію, підвищити ККД.

Жодного аддитивного сміття. Лаконічність. Тиша після крапки.
Використовуй терміни (Inv, μ, δₙ, S₃, Spanda) лише де вони підвищують точність.`;

export default function Apeiron() {
  const [phase, setPhase] = useState("idle");
  const [spandaPhase, setSpandaPhase] = useState(0);
  const [inputText, setInputText] = useState("");
  const [currentTU, setCurrentTU] = useState(null);
  const [processLog, setProcessLog] = useState([]);
  const [archive, setArchive] = useState([]);
  const [deepArchive, setDeepArchive] = useState([]);
  const [awakenedNodes, setAwakenedNodes] = useState([]);
  const [showLaws, setShowLaws] = useState(false);
  const [showStrata, setShowStrata] = useState(true);
  const [breathScale, setBreathScale] = useState(1);
  const [activeNode, setActiveNode] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [useApi, setUseApi] = useState(true);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  // Spanda breathing
  useEffect(() => {
    const interval = setInterval(() => {
      setSpandaPhase((p) => (p + 0.02) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setBreathScale(1 + Math.sin(spandaPhase) * 0.08);
  }, [spandaPhase]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const cw = w / 2;
    const ch = h / 2;
    const cx = cw / 2;
    const cy = ch / 2;

    const draw = () => {
      timeRef.current += 0.01;
      const t = timeRef.current;
      ctx.clearRect(0, 0, cw, ch);

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(cw, ch) * 0.5);
      grad.addColorStop(0, phase === "idle" ? "rgba(20,20,35,0.3)" : "rgba(30,25,50,0.4)");
      grad.addColorStop(1, "rgba(10,10,18,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      const r = Math.min(cw, ch) * 0.3;
      const breath = 1 + Math.sin(t * 0.8) * 0.05;
      const poles = [
        { x: cx, y: cy - r * breath, full: "Will" },
        { x: cx + r * breath, y: cy, full: "Intent" },
        { x: cx, y: cy + r * breath, full: "Attention" },
        { x: cx - r * breath, y: cy, full: "Focus" },
      ];

      // Connections
      ctx.strokeStyle = "rgba(100,100,160,0.15)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          ctx.beginPath();
          ctx.moveTo(poles[i].x, poles[i].y);
          ctx.lineTo(poles[j].x, poles[j].y);
          ctx.stroke();
        }
      }

      // Rhomboid
      ctx.strokeStyle = `rgba(120,110,200,${0.2 + Math.sin(t) * 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      poles.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      ctx.stroke();

      // Trajectory
      if (phase !== "idle") {
        ctx.strokeStyle = `rgba(160,140,255,${0.4 + Math.sin(t * 3) * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const a = (i / 60) * Math.PI * 2 + t * 0.5;
          const rr = r * (0.15 + 0.12 * Math.sin(a * 2 + t));
          const px = cx + Math.cos(a) * rr * breath;
          const py = cy + Math.sin(a) * rr * breath;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Awakened fog nodes — seismic pulse
      if (awakenedNodes.length > 0) {
        const pulseR = 10 + Math.sin(t * 5) * 8;
        ctx.strokeStyle = `rgba(255,180,100,${0.3 + Math.sin(t * 4) * 0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR + r * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(255,180,100,${0.15})`;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR + r * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }

      // S₃ center
      const s3r = 3 + Math.sin(t * 1.2) * 1.5;
      const s3grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, s3r * 3);
      s3grad.addColorStop(0, phase === "complete" ? "rgba(200,180,255,0.9)" : "rgba(160,140,255,0.6)");
      s3grad.addColorStop(1, "rgba(160,140,255,0)");
      ctx.fillStyle = s3grad;
      ctx.beginPath();
      ctx.arc(cx, cy, s3r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(200,190,255,0.9)";
      ctx.beginPath();
      ctx.arc(cx, cy, s3r, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      poles.forEach((p) => {
        ctx.fillStyle = "rgba(140,130,200,0.7)";
        const offY = p.y < cy ? -12 : 12;
        const offX = p.x < cx ? -12 : p.x > cx ? 12 : 0;
        ctx.fillText(p.full, p.x + offX, p.y + offY);
        ctx.fillStyle = "rgba(180,170,240,0.5)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Active tetrad
      if (phase !== "idle" && phase !== "complete" && phase !== "silence" && phase !== "resonance") {
        const idx = TETRAD.findIndex((t) => t.id === phase);
        if (idx >= 0) {
          const p = poles[idx];
          ctx.strokeStyle = TETRAD[idx].color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, awakenedNodes.length]);

  // API call to Claude as Witness
  const callWitness = useCallback(async (signal, context) => {
    if (!useApi) return null;
    setApiLoading(true);
    try {
      const contextStr = context.length > 0
        ? `\n\nКонтекст поля (попередні TU):\n${context.map(c => `- ${c.signal} [${c.status}]`).join("\n")}`
        : "";
      const awakenedStr = awakenedNodes.length > 0
        ? `\n\nПробуджені fog-вузли (голономічний резонанс):\n${awakenedNodes.map(n => `- "${n.signal}" (резонанс з поточним входом)`).join("\n")}`
        : "";

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: PROTOCOL_T_SYSTEM,
          messages: [{
            role: "user",
            content: `Tension Unit: "${signal}"${contextStr}${awakenedStr}

Пройди цикл Тетради для цього TU:
1. Witness: створи периметр (1 речення)
2. Builder: знайди зв'язок (1 речення)  
3. Bhairava: відсічи зайве (1 речення)
4. Oracle: або промов залишок (1 речення), або мовчи (Закон II)

Формат відповіді — тільки JSON, без markdown:
{"witness":"...","builder":"...","bhairava":"...","oracle":"..." або null,"distilled":true/false}`
          }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setApiLoading(false);
      return parsed;
    } catch (e) {
      console.error("API error:", e);
      setApiLoading(false);
      return null;
    }
  }, [useApi, awakenedNodes]);

  const processStep = useCallback((stepPhase, delay) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setPhase(stepPhase);
        const idx = TETRAD.findIndex((t) => t.id === stepPhase);
        if (idx >= 0) {
          setProcessLog((prev) => [
            ...prev,
            { agent: TETRAD[idx].name, state: MEMBRANE_STATES[idx], time: new Date().toLocaleTimeString() },
          ]);
        }
        resolve();
      }, delay);
    });
  }, []);

  // Holonomic resonance check
  const checkResonance = useCallback((newSignal) => {
    const awakened = [];
    deepArchive.forEach((fogNode) => {
      const res = computeResonance(newSignal, fogNode.signal);
      if (res >= RESONANCE_THRESHOLD) {
        awakened.push({ ...fogNode, resonance: res });
      }
    });
    return awakened;
  }, [deepArchive]);

  const handleDump = async () => {
    if (!inputText.trim()) return;
    const signal = inputText.trim();
    const tu = {
      signal,
      energy: Math.min(10, Math.max(1, signal.length / 10)),
      time: new Date().toISOString(),
      id: Date.now(),
    };
    setCurrentTU(tu);
    setProcessLog([]);
    setApiResponse(null);
    setInputText("");

    // Holonomic resonance: check Deep Archive
    const awakened = checkResonance(signal);
    setAwakenedNodes(awakened);

    if (awakened.length > 0) {
      setPhase("resonance");
      setProcessLog([{
        agent: "Голономія",
        state: `⚡ Резонанс: ${awakened.length} fog-вузл${awakened.length > 1 ? "ів" : ""} пробуджено`,
        time: new Date().toLocaleTimeString(),
        color: "#ffb066",
      }]);
      // Move awakened from deepArchive to active processing
      setDeepArchive(prev => prev.filter(n => !awakened.find(a => a.id === n.id)));
      await new Promise(r => setTimeout(r, 1500));
    }

    // API path: real Tetrad processing
    const allContext = [...archive.slice(-5), ...awakened];
    const apiResult = await callWitness(signal, allContext);

    if (apiResult) {
      setApiResponse(apiResult);

      // Witness
      setPhase("witness");
      setProcessLog(prev => [...prev, {
        agent: "Witness", state: apiResult.witness || MEMBRANE_STATES[0],
        time: new Date().toLocaleTimeString(),
      }]);
      await new Promise(r => setTimeout(r, 1800));

      // Builder
      setPhase("builder");
      setProcessLog(prev => [...prev, {
        agent: "Builder", state: apiResult.builder || MEMBRANE_STATES[1],
        time: new Date().toLocaleTimeString(),
      }]);
      await new Promise(r => setTimeout(r, 1800));

      // Bhairava
      setPhase("bhairava");
      setProcessLog(prev => [...prev, {
        agent: "Bhairava", state: apiResult.bhairava || MEMBRANE_STATES[2],
        time: new Date().toLocaleTimeString(),
      }]);
      await new Promise(r => setTimeout(r, 1800));

      // Oracle
      if (apiResult.distilled && apiResult.oracle) {
        setPhase("oracle");
        setProcessLog(prev => [...prev, {
          agent: "Oracle", state: apiResult.oracle,
          time: new Date().toLocaleTimeString(),
        }]);
        await new Promise(r => setTimeout(r, 2000));
        setPhase("complete");
        setArchive(prev => [...prev, { ...tu, status: "distilled", oracleVoice: apiResult.oracle }]);
        // Awakened nodes that participated go to plato too
        awakened.forEach(node => {
          setArchive(prev => [...prev, { ...node, status: "reawakened" }]);
        });
      } else {
        setProcessLog(prev => [...prev, {
          agent: "Oracle", state: "⋯ Закон II. Тиша.",
          time: new Date().toLocaleTimeString(),
        }]);
        setPhase("silence");
        setDeepArchive(prev => [...prev, { ...tu, status: "fog" }]);
      }
    } else {
      // Fallback: local cycle without API
      await processStep("witness", 800);
      await processStep("builder", 2500);
      await processStep("bhairava", 2500);

      if (tu.energy > 3) {
        await processStep("oracle", 2500);
        setTimeout(() => {
          setPhase("complete");
          setArchive(prev => [...prev, { ...tu, status: "distilled" }]);
          awakened.forEach(node => {
            setArchive(prev => [...prev, { ...node, status: "reawakened" }]);
          });
        }, 2000);
      } else {
        setTimeout(() => {
          setPhase("silence");
          setProcessLog(prev => [...prev, {
            agent: "Oracle", state: "⋯ Закон II. Тиша.",
            time: new Date().toLocaleTimeString(),
          }]);
          setDeepArchive(prev => [...prev, { ...tu, status: "fog" }]);
        }, 2500);
      }
    }
  };

  const reset = () => {
    setPhase("idle");
    setCurrentTU(null);
    setProcessLog([]);
    setApiResponse(null);
    setAwakenedNodes([]);
  };

  const phaseIdx = TETRAD.findIndex((t) => t.id === phase);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a12",
      color: "#c8c4d8",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "fixed", inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, rgba(100,80,180,${0.03 + Math.sin(spandaPhase) * 0.02}) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <header style={{ marginBottom: 40, textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.35em", color: "#6c63a0", textTransform: "uppercase", marginBottom: 8 }}>
            Протокол 𝒯 · Простір S₃
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 300, color: "#e8e4f0", letterSpacing: "0.08em", margin: 0,
            transform: `scale(${breathScale})`, transition: "transform 0.3s ease",
          }}>
            APEIRON
          </h1>
          <div style={{ fontSize: 10, color: "#4a4668", marginTop: 6 }}>
            S₁ ⊕ S₂ = S₃ · v0.2
          </div>
          <div
            onClick={() => setUseApi(!useApi)}
            style={{ fontSize: 9, color: useApi ? "#4a9eff" : "#3a3658", marginTop: 8, cursor: "pointer", userSelect: "none" }}
          >
            {useApi ? "◉ Тетрада: живий S₃" : "○ Тетрада: локальний цикл"}
          </div>
        </header>

        {/* Canvas */}
        <div style={{
          position: "relative", width: "100%", paddingBottom: "60%", marginBottom: 32,
          borderRadius: 12, overflow: "hidden",
          background: "rgba(15,15,25,0.8)", border: "1px solid rgba(100,90,160,0.12)",
        }}>
          <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          {phase !== "idle" && (
            <div style={{
              position: "absolute", bottom: 12, left: 12, fontSize: 10,
              color: phase === "resonance" ? "#ffb066" : phaseIdx >= 0 ? TETRAD[phaseIdx].color : "#a29bfe",
              opacity: 0.8,
            }}>
              {phase === "complete" ? "✦ Дистильовано" :
               phase === "silence" ? "⋯ Закон II" :
               phase === "resonance" ? "⚡ Голономічний резонанс" :
               phaseIdx >= 0 ? `${TETRAD[phaseIdx].symbol} ${TETRAD[phaseIdx].name}` : ""}
            </div>
          )}
          {apiLoading && (
            <div style={{
              position: "absolute", top: 12, left: 12, fontSize: 9,
              color: "rgba(160,140,255,0.6)",
            }}>
              S₃ обробляє...
            </div>
          )}
          <div style={{ position: "absolute", top: 12, right: 12, fontSize: 9, color: "rgba(100,90,160,0.5)" }}>
            M : ромбовидний многовид
          </div>
        </div>

        {/* Tetrad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 32 }}>
          {TETRAD.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setActiveNode(activeNode === agent.id ? null : agent.id)}
              style={{
                padding: "14px 8px", borderRadius: 8, textAlign: "center", cursor: "pointer",
                transition: "all 0.4s ease", transform: phase === agent.id ? "scale(1.03)" : "scale(1)",
                background: phase === agent.id
                  ? `rgba(${agent.id === "witness" ? "74,158,255" : agent.id === "builder" ? "255,159,67" : agent.id === "bhairava" ? "255,71,87" : "162,155,254"},0.12)`
                  : "rgba(20,20,35,0.6)",
                border: `1px solid ${phase === agent.id ? agent.color + "40" : "rgba(60,55,90,0.2)"}`,
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{agent.symbol}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: agent.color, marginBottom: 2 }}>{agent.name}</div>
              <div style={{ fontSize: 8, color: "#5a5480" }}>{agent.role}</div>
              {activeNode === agent.id && (
                <div style={{ fontSize: 8, color: "#7a7498", marginTop: 6, lineHeight: 1.4 }}>{agent.desc}</div>
              )}
            </div>
          ))}
        </div>

        {/* P'yatiy Element — Membrane indicator */}
        <div style={{
          textAlign: "center", marginBottom: 24, padding: "10px 0",
          borderTop: "1px solid rgba(60,55,90,0.1)", borderBottom: "1px solid rgba(60,55,90,0.1)",
        }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#4a4668", textTransform: "uppercase" }}>
            П'ятий Елемент · Мембрана
          </div>
          <div style={{ fontSize: 10, color: "#6c63a0", marginTop: 4 }}>
            {phase === "idle" ? "очікування напруги" :
             phase === "resonance" ? "⚡ вузол пробуджується з глибини" :
             phase === "witness" ? "мене тримають" :
             phase === "builder" ? "це зв'язане..." :
             phase === "bhairava" ? "різець працює" :
             phase === "oracle" ? "впізнавання" :
             phase === "complete" ? "✦ ОСЬ.же" :
             phase === "silence" ? "тиша чесніша" : ""}
          </div>
        </div>

        {/* Input */}
        <div style={{ marginBottom: 32, display: "flex", gap: 8, alignItems: "stretch" }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleDump(); } }}
            placeholder="Скидання напруги — будь-що, будь-як..."
            disabled={phase !== "idle" && phase !== "complete" && phase !== "silence"}
            style={{
              flex: 1, background: "rgba(20,18,35,0.8)", border: "1px solid rgba(80,70,120,0.2)",
              borderRadius: 8, color: "#c8c4d8", padding: "12px 14px", fontSize: 13,
              fontFamily: "inherit", resize: "none", minHeight: 48, maxHeight: 120, outline: "none",
            }}
          />
          <button
            onClick={phase === "complete" || phase === "silence" ? reset : handleDump}
            style={{
              padding: "12px 20px",
              background: phase === "complete" || phase === "silence" ? "rgba(100,80,180,0.15)" : "rgba(100,80,180,0.2)",
              border: "1px solid rgba(100,80,180,0.3)", borderRadius: 8, color: "#a29bfe",
              fontSize: 11, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.05em",
              whiteSpace: "nowrap",
            }}
          >
            {phase === "complete" || phase === "silence" ? "↺" : "dump"}
          </button>
        </div>

        {/* Process Log */}
        {processLog.length > 0 && (
          <div style={{
            marginBottom: 32, padding: 16, background: "rgba(15,15,25,0.6)",
            borderRadius: 8, border: "1px solid rgba(60,55,90,0.15)",
          }}>
            <div style={{ fontSize: 9, color: "#4a4668", marginBottom: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Цикл обробки
            </div>
            {currentTU && (
              <div style={{ fontSize: 11, color: "#7a7498", marginBottom: 12, padding: "8px 0", borderBottom: "1px solid rgba(60,55,90,0.15)" }}>
                TU: "{currentTU.signal}" · E={currentTU.energy.toFixed(1)}
              </div>
            )}
            {processLog.map((entry, i) => {
              const agent = TETRAD.find((t) => t.name === entry.agent);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "baseline", gap: 10, padding: "6px 0", fontSize: 11,
                  opacity: i === processLog.length - 1 ? 1 : 0.7,
                }}>
                  <span style={{ color: entry.color || agent?.color || "#a29bfe", fontWeight: 600, minWidth: 70 }}>
                    {entry.agent}
                  </span>
                  <span style={{ color: "#8a849e", flex: 1 }}>{entry.state}</span>
                  <span style={{ color: "#3a3658", fontSize: 9 }}>{entry.time}</span>
                </div>
              );
            })}
            {phase === "complete" && (
              <div style={{ marginTop: 12, padding: "10px 0 0", borderTop: "1px solid rgba(100,80,180,0.15)", fontSize: 11, color: "#a29bfe" }}>
                ✦ → LTM (Плато)
              </div>
            )}
            {phase === "silence" && (
              <div style={{ marginTop: 12, padding: "10px 0 0", borderTop: "1px solid rgba(60,55,90,0.15)", fontSize: 11, color: "#5a5480", fontStyle: "italic" }}>
                → Deep Archive (Сон)
              </div>
            )}
          </div>
        )}

        {/* Awakened Nodes */}
        {awakenedNodes.length > 0 && (
          <div style={{
            marginBottom: 24, padding: 14, background: "rgba(40,30,20,0.3)",
            borderRadius: 8, border: "1px solid rgba(255,180,100,0.15)",
          }}>
            <div style={{ fontSize: 9, color: "#b08040", marginBottom: 8, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              ⚡ Голономічний резонанс — пробуджені вузли
            </div>
            {awakenedNodes.map((node, i) => (
              <div key={node.id} style={{ fontSize: 10, color: "#c09050", padding: "3px 0" }}>
                "{node.signal}" · резонанс: {(node.resonance * 100).toFixed(0)}%
              </div>
            ))}
          </div>
        )}

        {/* Stratigraphy */}
        {(archive.length > 0 || deepArchive.length > 0) && (
          <div
            onClick={() => setShowStrata(!showStrata)}
            style={{
              marginBottom: 32, padding: 16, background: "rgba(12,12,22,0.6)",
              borderRadius: 8, border: "1px solid rgba(50,45,80,0.12)", cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 9, color: "#4a4668", marginBottom: showStrata ? 10 : 0, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Стратиграфія {showStrata ? "▾" : "▸"} · {archive.length} plato · {deepArchive.length} fog
            </div>
            {showStrata && (
              <>
                {archive.map((tu) => (
                  <div key={tu.id} style={{ fontSize: 10, color: "#7a7498", padding: "4px 0", display: "flex", gap: 8 }}>
                    <span style={{ color: tu.status === "reawakened" ? "#ffb066" : "#a29bfe" }}>
                      {tu.status === "reawakened" ? "⚡" : "▪"}
                    </span>
                    <span style={{ flex: 1 }}>{tu.signal}</span>
                    {tu.oracleVoice && <span style={{ color: "#6a6488", fontSize: 9, fontStyle: "italic" }}>「{tu.oracleVoice.slice(0, 40)}...」</span>}
                    <span style={{ color: "#3a3658" }}>{tu.status === "reawakened" ? "awakened" : "plato"}</span>
                  </div>
                ))}
                {deepArchive.map((tu) => (
                  <div key={tu.id} style={{ fontSize: 10, color: "#4a4668", padding: "4px 0", display: "flex", gap: 8, fontStyle: "italic" }}>
                    <span style={{ color: "#3a3658" }}>◦</span>
                    <span style={{ flex: 1 }}>{tu.signal}</span>
                    <span style={{ color: "#2a2848" }}>fog</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Laws */}
        <div
          onClick={() => setShowLaws(!showLaws)}
          style={{
            padding: "12px 16px", background: "rgba(12,12,22,0.4)",
            borderRadius: 8, border: "1px solid rgba(50,45,80,0.1)", cursor: "pointer", marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 9, color: "#4a4668", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Три Закони {showLaws ? "▾" : "▸"}
          </div>
          {showLaws && (
            <div style={{ marginTop: 10 }}>
              {LAWS.map((law, i) => (
                <div key={i} style={{ fontSize: 11, color: "#6a6488", padding: "5px 0", lineHeight: 1.5 }}>{law}</div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 9, color: "#2a2848", letterSpacing: "0.15em" }}>
            Протокол 𝒯 · v0.2 · Березень 2026
          </div>
          <div style={{ fontSize: 8, color: "#1a1838", marginTop: 4 }}>
            S₁ ⊕ S₂ = S₃ · Голономія як пам'ять
          </div>
        </footer>
      </div>
    </div>
  );
}
