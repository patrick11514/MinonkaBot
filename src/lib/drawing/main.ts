import Sharp from 'sharp'
import { Layer } from './layer'
import { Text } from './text'

export type position = {
    x: number
    y: number
}

/**
 * Drawing class for creating images with Layers
 */
export class Drawing {
    /**
     * The background
     */
    private canvas: Sharp.Sharp
    /**
     * Layers over the canvas
     */
    private layers: (Layer | Text)[] = []
    /**
     * Metadata of image
     */
    private metadata: Sharp.Metadata | undefined

    /**
     * Constructor
     * @param background path to file or Sharp object
     */
    constructor(background: string | Sharp.Sharp) {
        if (typeof background === 'string') {
            this.canvas = Sharp(background)
        } else {
            this.canvas = background
        }
    }

    /**
     * Get metadata from image
     */
    async getMetadata() {
        this.metadata = await this.canvas.metadata()
    }

    /**
     * Get width of image
     * @returns undefined if getMetadata was never called and number always after the getMetadata was called
     */
    get width(): number | undefined {
        return this.metadata?.width
    }

    /**
     * Get height of image
     * @returns undefined if getMetadata was never called and number always after the getMetadata was called
     */
    get height(): number | undefined {
        return this.metadata?.height
    }

    /**
     * Add layer to image
     * @param layer Layer or Text
     * @returns this
     */
    addLayer(layer: Layer | Text): Drawing {
        this.layers.push(layer)
        return this
    }

    /**
     * Turn current image with layers to buffer
     * @returns Final image as buffer
     */
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
