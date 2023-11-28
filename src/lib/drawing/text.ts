import Sharp from 'sharp'
import { position } from './main'

type size = {
    width: number
    height: number
}

export class Text {
    private canvas: Sharp.Sharp
    public size: size
    public position: position

    private text: string
    private font: string
    private fontSize: number
    private color: `#${string}`
    private center: boolean
    private bold: boolean
    private outline: boolean

    constructor({
        text,
        font = 'Beaufort for LOL Ja',
        fontSize,
        size,
        position,
        color = '#ffffff',
        center = true,
        bold = false,
        outline = false,
    }: {
        text: string
        font: string
        fontSize: number
        size: size
        position: position
        color: `#${string}`
        center: boolean
        bold: boolean
        outline: boolean
    }) {
        this.canvas = Sharp()
        this.text = text
        this.font = font
        this.fontSize = fontSize
        this.color = color
        this.center = center
        this.bold = bold
        this.outline = outline

        this.size = size
        this.position = position
    }

    public async toBuffer(): Promise<Buffer> {
        return this.canvas.toBuffer()
    }
}
