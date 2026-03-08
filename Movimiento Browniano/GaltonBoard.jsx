'use client'
/**
 * GaltonBoard — Componente React/MDX
 *
 * Izquierda : Canvas con animación de bolas y trazado del camino
 * Derecha   : Histograma SVG en tiempo real + curva binomial teórica
 *
 * Para usar Plotly en lugar del histograma SVG:
 *   1. npm install react-plotly.js plotly.js-dist-min
 *   2. En Next.js: const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })
 *   3. Sustituye <SvgHistogram … /> por <PlotlyHistogram bins={bins} total={ballCount} rows={ROWS} height={height} />
 *
 * Uso en MDX:
 *   import { GaltonBoard } from './GaltonBoard'
 *   <GaltonBoard rows={12} width={480} height={460} />
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Constantes por defecto ───────────────────────────────────────────────────
const DEF_ROWS    = 12
const MAX_ACTIVE  = 6    // bolas simultáneas en pantalla
const SPAWN_EVERY = 35   // frames entre bolas
const BALL_R      = 6    // radio de la bola
const PEG_R       = 4.5  // radio del clavija
const BALL_SPEED  = 5    // px/frame

// ─── Helpers de layout ───────────────────────────────────────────────────────
const layout = (W, H, rows) => {
  const topY      = 55
  const bottomY   = H - 65
  const spacingY  = (bottomY - topY) / (rows + 1)
  const spacingX  = spacingY * 0.95
  const cx        = W / 2
  return { topY, bottomY, spacingY, spacingX, cx, W, H }
}

const pegPos = (row, col, L) => ({
  x: L.cx + (col - row / 2) * L.spacingX,
  y: L.topY + row * L.spacingY,
})

const binX = (bin, rows, L) => L.cx + (bin - rows / 2) * L.spacingX

// Camino de waypoints para una bola (precomputado)
function buildWaypoints(rows, L) {
  const dirs = Array.from({ length: rows }, () => (Math.random() < 0.5 ? 1 : -1))
  const bin  = dirs.filter(d => d === 1).length

  const wps = [{ x: L.cx, y: L.topY - 28 }]
  let col = 0

  for (let row = 0; row < rows; row++) {
    const peg  = pegPos(row, col, L)
    const dir  = dirs[row]
    const next = pegPos(row + 1, col + (dir === 1 ? 1 : 0), L)

    wps.push({ x: peg.x, y: peg.y })
    wps.push({ x: peg.x + dir * L.spacingX * 0.45, y: (peg.y + next.y) / 2 })
    if (dir === 1) col++
  }

  const lastPeg = pegPos(rows, col, L)
  wps.push({ x: lastPeg.x, y: lastPeg.y })
  wps.push({ x: binX(bin, rows, L), y: L.bottomY })

  return { wps, bin, dirs }
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function GaltonBoard({ rows = DEF_ROWS, width = 480, height = 460 }) {
  const canvasRef  = useRef(null)
  const animRef    = useRef(null)
  const gs         = useRef({ balls: [], bins: new Array(rows + 1).fill(0), frame: 0, running: false })

  const [bins,       setBins]      = useState(() => new Array(rows + 1).fill(0))
  const [ballCount,  setBallCount] = useState(0)
  const [running,    setRunning]   = useState(false)
  const [speed,      setSpeed]     = useState(1)

  // Sincroniza velocidad al ref sin reiniciar el loop
  const speedRef = useRef(speed)
  useEffect(() => { speedRef.current = speed }, [speed])

  // ─── Loop de animación ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const state = gs.current

    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      const W = canvas.width
      const H = canvas.height
      const L = layout(W, H, rows)

      // ── Update (puede correr múltiples steps por frame según velocidad) ──
      const steps = speedRef.current
      for (let s = 0; s < steps; s++) {
        if (!state.running) break
        state.frame++

        // Spawn
        const active = state.balls.filter(b => !b.settled).length
        if (active < MAX_ACTIVE && state.frame % SPAWN_EVERY === 0) {
          const { wps, bin, dirs } = buildWaypoints(rows, L)
          state.balls.push({ wps, bin, dirs, wpIdx: 0, x: wps[0].x, y: wps[0].y, settled: false })
        }

        // Mover bolas
        for (const ball of state.balls) {
          if (ball.settled) continue
          if (ball.wpIdx >= ball.wps.length - 1) {
            ball.settled = true
            state.bins[ball.bin]++
            setBins([...state.bins])
            setBallCount(n => n + 1)
            continue
          }
          const target = ball.wps[ball.wpIdx + 1]
          const dx = target.x - ball.x
          const dy = target.y - ball.y
          const dist = Math.hypot(dx, dy)
          if (dist < BALL_SPEED) {
            ball.x = target.x; ball.y = target.y; ball.wpIdx++
          } else {
            ball.x += (dx / dist) * BALL_SPEED
            ball.y += (dy / dist) * BALL_SPEED
          }
        }

        // Limpieza
        if (state.balls.length > 600) state.balls.splice(0, 300)
      }

      // ── Draw ──────────────────────────────────────────────────────────────
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)
      const { topY, bottomY, spacingX, spacingY, cx } = L

      // Paredes y divisores de cubetas
      ctx.strokeStyle = '#1e3a5f'; ctx.lineWidth = 1.5
      const lx = binX(0, rows, L) - spacingX / 2
      const rx = binX(rows, rows, L) + spacingX / 2
      ctx.beginPath()
      ctx.moveTo(lx, bottomY); ctx.lineTo(lx, H - 4)
      ctx.moveTo(rx, bottomY); ctx.lineTo(rx, H - 4)
      ctx.moveTo(lx, H - 4);  ctx.lineTo(rx, H - 4)
      ctx.stroke()
      for (let i = 0; i <= rows; i++) {
        const bx = binX(i, rows, L) - spacingX / 2
        ctx.beginPath(); ctx.moveTo(bx, bottomY); ctx.lineTo(bx, H - 4); ctx.stroke()
      }
      ctx.beginPath(); ctx.moveTo(rx - spacingX, bottomY); ctx.lineTo(rx - spacingX, H - 4); ctx.stroke()

      // Bolas apiladas en cubetas
      const maxBin = Math.max(...state.bins, 1)
      for (let i = 0; i <= rows; i++) {
        const count = state.bins[i]
        if (!count) continue
        const bx  = binX(i, rows, L)
        const maxH = Math.floor((H - 4 - bottomY) / (BALL_R * 2 + 1))
        const show = Math.min(count, maxH)
        for (let j = 0; j < show; j++) {
          const by = H - 4 - BALL_R - j * (BALL_R * 2 + 1)
          ctx.beginPath(); ctx.arc(bx, by, BALL_R - 1, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(59,130,246,${0.45 + 0.55 * count / maxBin})`
          ctx.fill()
        }
      }

      // Clavijas
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= r; c++) {
          const { x, y } = pegPos(r, c, L)
          ctx.beginPath(); ctx.arc(x, y, PEG_R, 0, Math.PI * 2)
          ctx.fillStyle = '#475569'; ctx.fill()
          ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; ctx.stroke()
        }
      }

      // Bolas activas + rastro
      for (const ball of state.balls) {
        if (ball.settled) continue

        // Rastro (path recorrido hasta ahora)
        if (ball.wpIdx > 0) {
          ctx.beginPath()
          ctx.moveTo(ball.wps[0].x, ball.wps[0].y)
          for (let i = 1; i <= ball.wpIdx; i++) ctx.lineTo(ball.wps[i].x, ball.wps[i].y)
          ctx.lineTo(ball.x, ball.y)
          ctx.strokeStyle = 'rgba(99,102,241,0.55)'; ctx.lineWidth = 1.5; ctx.stroke()
        }

        // Bola con gradiente
        const grd = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, BALL_R)
        grd.addColorStop(0, '#fef9c3')
        grd.addColorStop(1, '#f59e0b')
        ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2)
        ctx.fillStyle = grd; ctx.fill()
        ctx.strokeStyle = '#b45309'; ctx.lineWidth = 1; ctx.stroke()
      }

      // Punto de entrada
      ctx.beginPath(); ctx.arc(cx, topY - 38, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#f1f5f9'; ctx.fill()
      ctx.beginPath()
      ctx.moveTo(cx - 12, topY - 32); ctx.lineTo(cx, topY - 18); ctx.lineTo(cx + 12, topY - 32)
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.stroke()
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [rows])

  const toggle = () => {
    const next = !running
    setRunning(next)
    gs.current.running = next
  }

  const reset = () => {
    gs.current.balls = []
    gs.current.bins  = new Array(rows + 1).fill(0)
    gs.current.frame = 0
    setBins(new Array(rows + 1).fill(0))
    setBallCount(0)
  }

  return (
    <div style={styles.wrapper}>
      {/* Controles */}
      <div style={styles.controls}>
        <button onClick={toggle} style={{ ...styles.btn, background: running ? '#ef4444' : '#22c55e' }}>
          {running ? '⏸ Pausar' : '▶ Iniciar'}
        </button>
        <button onClick={reset} style={styles.btnGhost}>↺ Reiniciar</button>
        <label style={styles.label}>
          Velocidad&nbsp;
          <select value={speed} onChange={e => setSpeed(Number(e.target.value))} style={styles.select}>
            <option value={1}>×1</option>
            <option value={2}>×2</option>
            <option value={4}>×4</option>
            <option value={8}>×8</option>
          </select>
        </label>
        <span style={styles.info}>{ballCount} bolas · {rows} filas</span>
      </div>

      {/* Tablero + Histograma */}
      <div style={styles.row}>
        <canvas ref={canvasRef} width={width} height={height} style={styles.canvas} />
        <SvgHistogram bins={bins} rows={rows} total={ballCount} height={height} />
        {/*
          Para usar Plotly, reemplaza <SvgHistogram> por:
          <PlotlyHistogram bins={bins} rows={rows} total={ballCount} height={height} />
        */}
      </div>
    </div>
  )
}

// ─── Histograma SVG (sin dependencias) ───────────────────────────────────────
function SvgHistogram({ bins, rows, total, height }) {
  const W  = 310
  const H  = height
  const pL = 48, pR = 16, pT = 36, pB = 44
  const cW = W - pL - pR
  const cH = H - pT - pB

  // Distribución binomial teórica escalada
  const fact = n => (n <= 1 ? 1 : n * fact(n - 1))
  const binom = (n, k) => fact(n) / (fact(k) * fact(n - k))
  const theo  = bins.map((_, k) => total * binom(rows, k) * 0.5 ** rows)

  const maxVal = Math.max(...bins, ...theo, 1)
  const toY    = v => pT + cH - (v / maxVal) * cH
  const barW   = cW / bins.length

  const ticks  = [0, 0.25, 0.5, 0.75, 1].map(f => ({ f, v: Math.round(maxVal * f), y: toY(maxVal * f) }))

  return (
    <svg width={W} height={H} style={styles.svg}>
      {/* Fondo y grid */}
      <rect width={W} height={H} fill="#1e293b" rx={8} />
      {ticks.map(({ y, v }) => (
        <g key={v}>
          <line x1={pL} y1={y} x2={pL + cW} y2={y} stroke="#293548" strokeWidth={1} />
          <text x={pL - 6} y={y + 4} textAnchor="end" fill="#64748b" fontSize={9}>{v}</text>
        </g>
      ))}

      {/* Barras de simulación */}
      {bins.map((v, i) => {
        const bh = (v / maxVal) * cH
        return (
          <rect key={i}
            x={pL + i * barW + 1} y={toY(v)}
            width={barW - 2} height={bh}
            fill="#3b82f6" opacity={0.82} rx={2}
          />
        )
      })}

      {/* Curva binomial teórica */}
      {total > 0 && (
        <polyline
          points={theo.map((v, i) => `${pL + i * barW + barW / 2},${toY(v)}`).join(' ')}
          fill="none" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5,3"
        />
      )}

      {/* Ejes */}
      <line x1={pL} y1={pT} x2={pL} y2={pT + cH} stroke="#475569" strokeWidth={1.5} />
      <line x1={pL} y1={pT + cH} x2={pL + cW} y2={pT + cH} stroke="#475569" strokeWidth={1.5} />

      {/* Labels eje X (cada 2) */}
      {bins.map((_, i) => i % 2 === 0 && (
        <text key={i} x={pL + i * barW + barW / 2} y={pT + cH + 14}
          textAnchor="middle" fill="#64748b" fontSize={9}>{i}</text>
      ))}
      <text x={pL + cW / 2} y={H - 6} textAnchor="middle" fill="#475569" fontSize={10}>Cubeta (nº de derechas)</text>

      {/* Título */}
      <text x={W / 2} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="600">
        Distribución — {total} bolas
      </text>

      {/* Leyenda */}
      <rect x={pL} y={pT + 8} width={9} height={9} fill="#3b82f6" opacity={0.82} rx={1} />
      <text x={pL + 13} y={pT + 16} fill="#94a3b8" fontSize={9}>Simulación</text>
      <line x1={pL} y1={pT + 28} x2={pL + 12} y2={pT + 28} stroke="#f43f5e" strokeWidth={2} strokeDasharray="4,2" />
      <text x={pL + 16} y={pT + 32} fill="#94a3b8" fontSize={9}>Binomial B({rows}, 0.5)</text>
    </svg>
  )
}

// ─── Alternativa con Plotly (requiere react-plotly.js) ────────────────────────
/*
import dynamic from 'next/dynamic'
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

function PlotlyHistogram({ bins, rows, total, height }) {
  const fact  = n => (n <= 1 ? 1 : n * fact(n - 1))
  const binom = (n, k) => fact(n) / (fact(k) * fact(n - k))
  const theo  = bins.map((_, k) => total * binom(rows, k) * 0.5 ** rows)
  const x     = bins.map((_, i) => i)

  return (
    <Plot
      data={[
        { type: 'bar', x, y: bins, name: 'Simulación', marker: { color: '#3b82f6', opacity: 0.82 } },
        { type: 'scatter', x, y: theo, name: `B(${rows}, 0.5)`, mode: 'lines',
          line: { color: '#f43f5e', width: 2, dash: 'dot' } },
      ]}
      layout={{
        paper_bgcolor: '#0f172a', plot_bgcolor: '#1e293b',
        font: { color: '#e2e8f0', size: 11 },
        margin: { t: 36, r: 16, b: 48, l: 52 },
        xaxis: { title: 'Cubeta', gridcolor: '#293548', color: '#94a3b8' },
        yaxis: { title: 'Bolas',  gridcolor: '#293548', color: '#94a3b8' },
        title: { text: `Distribución — ${total} bolas`, font: { size: 13 } },
        legend: { x: 0.65, y: 0.95 },
        bargap: 0.12,
      }}
      style={{ width: '100%', height: `${height}px` }}
      config={{ displayModeBar: false }}
    />
  )
}
*/

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = {
  wrapper:  { background: '#0f172a', padding: '16px', borderRadius: '12px', fontFamily: 'system-ui, sans-serif', display: 'inline-block' },
  controls: { display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' },
  btn:      { padding: '7px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '13px' },
  btnGhost: { padding: '7px 14px', borderRadius: '6px', border: '1px solid #334155', cursor: 'pointer', background: 'transparent', color: '#94a3b8', fontSize: '13px' },
  label:    { color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' },
  select:   { background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', borderRadius: '4px', padding: '2px 6px', fontSize: '13px' },
  info:     { color: '#475569', fontSize: '12px', marginLeft: '4px' },
  row:      { display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-start' },
  canvas:   { borderRadius: '8px', border: '1px solid #1e293b', display: 'block' },
  svg:      { borderRadius: '8px', display: 'block' },
}
