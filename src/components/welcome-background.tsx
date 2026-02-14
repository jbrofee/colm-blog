import * as PIXI from 'pixi.js';
import { defineHex, Grid, rectangle } from 'honeycomb-grid'
import { useEffect, useRef } from 'react';

// Size of hexes
const HEX_SIZE = 90
const HEX_STROKE_WIDTH = 1
// Silver outline
const HEX_COLOR = 0xc0c0c0
// Black fill
const HEX_FILL_COLOR = 0x000000
const HEX_FILL_ALPHA = 1
const HEX_STROKE_ALPHA = 1
const HEX_HOVER_TARGET_ALPHA = 0
const HEX_DEFAULT_ALPHA = 1
const HEX_HOVER_SPEED = 0.2
const HEX_RETURN_SPEED = 0.08
const GRID_OVERSCAN = 6
const GRID_OFFSET_X = -HEX_SIZE
const GRID_OFFSET_Y = -HEX_SIZE

const Hex = defineHex({ dimensions: HEX_SIZE, origin: 'topLeft' })
type GridHex = InstanceType<typeof Hex>

function drawHex(graphics: PIXI.Graphics, corners: GridHex['corners']) {
    graphics.clear()
    graphics
        .poly(corners)
        .fill({ color: HEX_FILL_COLOR, alpha: HEX_FILL_ALPHA })
        .stroke({
            width: HEX_STROKE_WIDTH,
            color: HEX_COLOR,
            alpha: HEX_STROKE_ALPHA,
        })
}

export default function WelcomeBackground() {
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const app = new PIXI.Application()
        let gridLayer: PIXI.Container | null = null
        let resizeFrame = 0
        const alphaAnimations = new Map<PIXI.Graphics, { targetAlpha: number; speed: number }>()

        const tick = (ticker: PIXI.Ticker) => {
            if (alphaAnimations.size === 0) return

            alphaAnimations.forEach((animation, hexGraphic) => {
                const delta = animation.targetAlpha - hexGraphic.alpha
                if (Math.abs(delta) < 0.01) {
                    hexGraphic.alpha = animation.targetAlpha
                    alphaAnimations.delete(hexGraphic)
                    return
                }

                hexGraphic.alpha += delta * animation.speed * ticker.deltaTime
            })
        }

        const setup = async () => {
            await app.init({
                backgroundAlpha: 0,
                resizeTo: container,
                antialias: true,
            })

            container.appendChild(app.canvas)
            app.canvas.style.position = 'absolute'
            app.canvas.style.inset = '0'
            app.canvas.style.width = '100%'
            app.canvas.style.height = '100%'
            app.canvas.style.display = 'block'

            app.ticker.add(tick)

            const renderGrid = () => {
                const width = container.clientWidth
                const height = container.clientHeight
                const columns = Math.ceil(width / HEX_SIZE) + GRID_OVERSCAN
                const rows = Math.ceil(height / HEX_SIZE) + GRID_OVERSCAN
                const grid = new Grid(Hex, rectangle({ width: columns, height: rows }))

                gridLayer?.destroy({ children: true })
                gridLayer = new PIXI.Container()
                gridLayer.x = GRID_OFFSET_X
                gridLayer.y = GRID_OFFSET_Y
                alphaAnimations.clear()

                grid.forEach((hex: GridHex) => {
                    const hexGraphic = new PIXI.Graphics()
                    drawHex(hexGraphic, hex.corners)
                    hexGraphic.alpha = HEX_DEFAULT_ALPHA
                    hexGraphic.eventMode = 'static'
                    hexGraphic.cursor = 'pointer'
                    hexGraphic.on('pointerover', () => {
                        alphaAnimations.set(hexGraphic, {
                            targetAlpha: HEX_HOVER_TARGET_ALPHA,
                            speed: HEX_HOVER_SPEED,
                        })
                    })
                    // hexGraphic.on('pointerout', () => {
                    //     alphaAnimations.set(hexGraphic, {
                    //         targetAlpha: HEX_DEFAULT_ALPHA,
                    //         speed: HEX_RETURN_SPEED,
                    //     })
                    // })
                    gridLayer?.addChild(hexGraphic)
                })

                app.stage.addChild(gridLayer)
            }

            renderGrid()

            const resizeObserver = new ResizeObserver(() => {
                cancelAnimationFrame(resizeFrame)
                resizeFrame = requestAnimationFrame(() => {
                    renderGrid()
                })
            })

            resizeObserver.observe(container)

            return () => {
                resizeObserver.disconnect()
                app.ticker.remove(tick)
            }
        }

        let cleanupResizeObserver: (() => void) | undefined
        void setup().then((cleanup) => {
            cleanupResizeObserver = cleanup
        })

        return () => {
            cleanupResizeObserver?.()
            cancelAnimationFrame(resizeFrame)
            gridLayer?.destroy({ children: true })
            app.destroy(true, { children: true })
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden bg-[url('/welcome-background.jpg')] bg-cover bg-center"
        />
    )
}