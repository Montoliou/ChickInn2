import { createCanvas } from '@napi-rs/canvas'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = resolve(__dirname, '..', 'public')

const BASE = 512
const BG = '#efe0b8'
const INK = '#141414'

function drawChicken(ctx) {
  ctx.fillStyle = INK

  // Body
  ctx.beginPath()
  ctx.ellipse(175, 145, 115, 62, 0, 0, Math.PI * 2)
  ctx.fill()

  // Head
  ctx.beginPath()
  ctx.ellipse(258, 75, 40, 37, 0, 0, Math.PI * 2)
  ctx.fill()

  // Neck bridge (trapezoid merging head + body)
  ctx.beginPath()
  ctx.moveTo(222, 108)
  ctx.lineTo(232, 58)
  ctx.lineTo(276, 56)
  ctx.lineTo(290, 112)
  ctx.closePath()
  ctx.fill()

  // Comb (three rounded bumps)
  for (const [cx, cy, r] of [
    [238, 38, 10],
    [256, 28, 11],
    [274, 36, 10],
  ]) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Beak — pointier, more visible
  ctx.beginPath()
  ctx.moveTo(294, 68)
  ctx.lineTo(338, 82)
  ctx.lineTo(294, 94)
  ctx.closePath()
  ctx.fill()

  // Tail — curved upward sweep from back of body
  ctx.beginPath()
  ctx.moveTo(70, 130)
  ctx.quadraticCurveTo(10, 105, 18, 35)
  ctx.quadraticCurveTo(40, 45, 60, 65)
  ctx.quadraticCurveTo(85, 85, 95, 135)
  ctx.closePath()
  ctx.fill()

  // Legs
  ctx.fillRect(148, 200, 11, 36)
  ctx.fillRect(192, 200, 11, 36)

  // Feet
  ctx.beginPath()
  ctx.moveTo(138, 236)
  ctx.lineTo(172, 236)
  ctx.lineTo(165, 246)
  ctx.lineTo(145, 246)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(182, 236)
  ctx.lineTo(216, 236)
  ctx.lineTo(209, 246)
  ctx.lineTo(189, 246)
  ctx.closePath()
  ctx.fill()
}

function drawFlourish(ctx, y) {
  // Simple centered decorative line: diamond — line — diamond
  ctx.fillStyle = INK
  ctx.strokeStyle = INK
  ctx.lineWidth = 2

  const cx = 256
  const halfLine = 70

  // Left line
  ctx.beginPath()
  ctx.moveTo(cx - halfLine, y)
  ctx.lineTo(cx - 18, y)
  ctx.stroke()

  // Right line
  ctx.beginPath()
  ctx.moveTo(cx + 18, y)
  ctx.lineTo(cx + halfLine, y)
  ctx.stroke()

  // Center diamond
  ctx.beginPath()
  ctx.moveTo(cx, y - 8)
  ctx.lineTo(cx + 8, y)
  ctx.lineTo(cx, y + 8)
  ctx.lineTo(cx - 8, y)
  ctx.closePath()
  ctx.fill()

  // Outer diamonds
  for (const dx of [-halfLine - 10, halfLine + 10]) {
    ctx.beginPath()
    ctx.moveTo(cx + dx, y - 6)
    ctx.lineTo(cx + dx + 6, y)
    ctx.lineTo(cx + dx, y + 6)
    ctx.lineTo(cx + dx - 6, y)
    ctx.closePath()
    ctx.fill()
  }
}

function renderIcon(size, { maskable = false } = {}) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const s = size / BASE

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, size, size)

  ctx.save()
  ctx.scale(s, s)

  // Chicken silhouette (local translate 90, 40)
  ctx.save()
  ctx.translate(90, 40)
  drawChicken(ctx)
  ctx.restore()

  // CHICK INN — bold serif
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = 'bold 80px Georgia, "Times New Roman", serif'
  ctx.fillText('CHICK INN', 256, 370)

  // Flourish under title
  drawFlourish(ctx, 400)

  // EST 2014
  ctx.font = 'italic 26px Georgia, "Times New Roman", serif'
  ctx.fillText('EST 2014', 256, 438)

  ctx.restore()

  return canvas.toBuffer('image/png')
}

mkdirSync(PUBLIC_DIR, { recursive: true })

const outputs = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of outputs) {
  const buffer = renderIcon(size)
  writeFileSync(resolve(PUBLIC_DIR, name), buffer)
  console.log(`✓ ${name} (${size}x${size})`)
}

console.log('Done.')
