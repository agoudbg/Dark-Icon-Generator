import { createCanvas, loadImage } from '@napi-rs/canvas';
import { convertOnCanvas } from './core.js';

// icon: string/Buffer/Uint8Array
export type IconInput = string | Buffer | Uint8Array;

/**
 * Convert a light icon to a dark icon.
 * @param icon The icon to convert.
 * @returns The dark icon.
 */
export async function convertDarkIcon(icon: IconInput): Promise<Buffer> {
    // Load the icon if it's a string.
    let buffer: Buffer;
    if (typeof icon === 'string') {
        buffer = Buffer.from(icon, 'base64');
    } else {
        buffer = Buffer.from(icon);
    }

    // Create a canvas from the icon.
    const image = await loadImage(buffer);
    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);

    const backgroundCanvas = convertOnCanvas(context as unknown as CanvasRenderingContext2D, (w: number, h: number) => createCanvas(w, h));

    return (backgroundCanvas as unknown as { toBuffer: (type: string) => Buffer }).toBuffer('image/png');
}