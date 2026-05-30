const { createCanvas } = require('canvas')
const fs = require('fs')

const canvas = createCanvas(32, 32)
const ctx = canvas.getContext('2d')

// background
ctx.fillStyle = '#050a0f'
ctx.fillRect(0, 0, 32, 32)

// glowing dot
ctx.beginPath()
ctx.arc(16, 16, 6, 0, Math.PI * 2)
ctx.fillStyle = '#378ADD'
ctx.fill()

// outer ring
ctx.beginPath()
ctx.arc(16, 16, 10, 0, Math.PI * 2)
ctx.strokeStyle = '#378ADD'
ctx.lineWidth = 1.5
ctx.stroke()

fs.writeFileSync('src/assets/tray-icon.png', canvas.toBuffer('image/png'))
console.log('Icon created.')