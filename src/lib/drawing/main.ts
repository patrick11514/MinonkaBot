import Sharp from 'sharp'
import { Layer } from './layer'
import { Text } from './text'

export type position = {
    x: number
    y: number
}

export class Drawing {
    private canvas: Sharp.Sharp
    private layers: (Layer | Text)[] = []
    private metadata: Sharp.Metadata | undefined

    constructor(background: string | Sharp.Sharp) {
        if (typeof background === 'string') {
            this.canvas = Sharp(background)
        } else {
            this.canvas = background
        }
    }

    async getMetadata() {
        this.metadata = await this.canvas.metadata()
    }

    get width(): number | undefined {
        return this.metadata?.width
    }

    get height(): number | undefined {
        return this.metadata?.height
    }

    addLayer(layer: Layer | Text): Drawing {
        this.layers.push(layer)
        return this
    }

    async toBuffer(): Promise<Buffer> {
        for (const layer of this.layers) {
            this.canvas.composite([
                {
                    left: layer.position.x,
                    top: layer.position.y,
                    input: await layer.toBuffer(),
                },
            ])
        }

        return this.canvas.toBuffer()
    }
}
