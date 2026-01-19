import { convertOnCanvas } from './core.js';

export type BrowserIconInput = string | Blob | File | ImageBitmap | HTMLImageElement;

function toBlobPromise(canvas: HTMLCanvasElement) {
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Failed to create Blob from canvas'));
                return;
            }

            resolve(blob);
        }, 'image/png');
    });
}

async function waitForImage(image: HTMLImageElement) {
    if (image.complete && image.naturalWidth !== 0) {
        return;
    }

    if (typeof image.decode === 'function') {
        await image.decode();
        return;
    }

    await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Failed to load image'));
    });
}

async function loadCanvasImage(imageSource: BrowserIconInput) {
    if (imageSource instanceof ImageBitmap) {
        return {
            source: imageSource as CanvasImageSource,
            width: imageSource.width,
            height: imageSource.height,
            cleanup: undefined as (() => void) | undefined,
        };
    }

    if (imageSource instanceof HTMLImageElement) {
        await waitForImage(imageSource);
        return {
            source: imageSource as CanvasImageSource,
            width: imageSource.naturalWidth || imageSource.width,
            height: imageSource.naturalHeight || imageSource.height,
            cleanup: undefined as (() => void) | undefined,
        };
    }

    const objectUrl = typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = objectUrl;

    try {
        await waitForImage(image);
    } catch (error) {
        if (typeof imageSource !== 'string') {
            URL.revokeObjectURL(objectUrl);
        }

        throw error;
    }

    const cleanup = typeof imageSource === 'string' ? undefined : () => URL.revokeObjectURL(objectUrl);

    return {
        source: image as CanvasImageSource,
        width: image.width,
        height: image.height,
        cleanup,
    };
}

/**
 * Convert a light icon to a dark icon in browser environment.
 *
 * @param imageSource The image source (URL, Blob, File, ImageBitmap, or HTMLImageElement).
 * @returns A Blob containing the dark icon.
 */
export async function convertDarkIcon(imageSource: BrowserIconInput): Promise<Blob> {
    const { source, width, height, cleanup } = await loadCanvasImage(imageSource);

    try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get canvas context');
        }

        context.drawImage(source, 0, 0);

        const backgroundCanvas = convertOnCanvas(
            context as CanvasRenderingContext2D,
            (w: number, h: number) => {
                const nextCanvas = document.createElement('canvas');
                nextCanvas.width = w;
                nextCanvas.height = h;
                return nextCanvas;
            }
        );

        return await toBlobPromise(backgroundCanvas as HTMLCanvasElement);
    } finally {
        cleanup?.();
    }
}

export default { convertDarkIcon };
