import { position } from './main'

type size = {
    width: number
    height: number
}

export class Text {
    public size: size
    public position: position

    private text: string
    private font: string
    private fontSize: number
    private color: `#${string}`
    private align: 'center' | 'left' | 'right'
    private bold: boolean
    private outline: boolean

    constructor({
        text,
        font = 'Beaufort for LOL Ja',
        fontSize,
        size,
        position,
        color = '#ffffff',
        align = 'center',
        bold = true,
        outline = false,
    }: {
        text: string
        font?: string
        fontSize: number
        size: size
        position: position
        color?: `#${string}`
        align?: 'center' | 'left' | 'right'
        bold?: boolean
        outline?: boolean
    }) {
        this.text = text
        this.font = font
        this.fontSize = fontSize
        this.color = color
        this.align = align
        this.bold = bold
        this.outline = outline
        this.size = size
        this.position = position
    }

    public async toBuffer(): Promise<Buffer> {
        return Buffer.from(`<svg width="${this.size.width}" height="${this.size.height}">
        <style>
            .text {
                font-family: '${this.font}';
                font-size: ${this.fontSize}px;
                fill: ${this.color};
                font-weight: ${this.bold ? 'bold' : 'normal'};
            }
            .outline {
                paint-order: stroke;
                stroke: #000000;
                stroke-width: 6px;
                stroke-linecap: butt;
                stroke-linejoin: miter;
            }
            svg {
                background: #fff;
            }
        </style>
        <text dy=".3em" y="50%" ${
            this.align === 'center'
                ? 'x="50%" text-anchor="middle"'
                : this.align === 'right'
                  ? 'x="100%" text-anchor="end"'
                  : ''
        } class="text${this.outline ? ' outline' : ''}">${this.text}</text>
    </svg>`)
    }
}
