export type CanvasFactory = (width: number, height: number) => CanvasLike;

export type CanvasLike = {
    width: number;
    height: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getContext(type: '2d'): any; // allow both DOM and node-canvas contexts
};

type Rgb = [number, number, number];

type ImageDataLike = ReturnType<CanvasRenderingContext2D['getImageData']>;

function isSimilar(color1: Rgb, color2: Rgb, colorTolerance = 32) {
    return Math.abs(color1[0] - color2[0]) < colorTolerance &&
        Math.abs(color1[1] - color2[1]) < colorTolerance &&
        Math.abs(color1[2] - color2[2]) < colorTolerance;
}

function getEdgeSize(width: number, height: number) {
    return Math.max(1, Math.floor(0.05 * Math.min(width, height)));
}

export function convertOnCanvas(context: CanvasRenderingContext2D, createCanvas: CanvasFactory): CanvasLike {
    const baseCanvas = context.canvas as unknown as CanvasLike;
    const { width, height } = baseCanvas;

    const makeBackground = () => {
        const backgroundCanvas = createCanvas(width, height);
        const backgroundContext = backgroundCanvas.getContext('2d');
        if (!backgroundContext) {
            throw new Error('Could not get background canvas context');
        }
        return { backgroundCanvas, backgroundContext };
    };

    const overlayFallback = () => {
        context.globalCompositeOperation = 'source-over';
        context.fillStyle = 'rgba(0, 0, 0, 0.1)';
        context.fillRect(0, 0, width, height);

        const { backgroundCanvas, backgroundContext } = makeBackground();
        backgroundContext.globalCompositeOperation = 'source-over';
        backgroundContext.drawImage(baseCanvas as unknown as CanvasImageSource, 0, 0);
        return backgroundCanvas;
    };

    const edgeSize = getEdgeSize(width, height);

    const edgeColorsRaw: Array<ImageDataLike['data']> = [
        context.getImageData(0, 0, edgeSize, height).data,
        context.getImageData(width - edgeSize, 0, edgeSize, height).data,
        context.getImageData(0, 0, width, edgeSize).data,
        context.getImageData(0, height - edgeSize, width, edgeSize).data,
    ];

    const edgeColorsRgb = edgeColorsRaw.map((edgeColors) => {
        const colors: Rgb[] = [];
        for (let i = 0; i < edgeColors.length; i += 4) {
            colors.push([edgeColors[i], edgeColors[i + 1], edgeColors[i + 2]]);
        }
        return colors;
    }).flat();

    const colorCount: Record<string, number> = {};

    edgeColorsRgb.forEach((color) => {
        const colorKey = color.join(',');
        if (colorCount[colorKey]) {
            colorCount[colorKey]++;
        } else {
            colorCount[colorKey] = 1;
        }
    });

    const sortedColors = Object.keys(colorCount).sort((a, b) => colorCount[b] - colorCount[a]);
    const mostFrequentColors = sortedColors.slice(0, 5).map((color) => ({
        color: color.split(',').map(Number) as Rgb,
        count: colorCount[color],
    }));

    const mostFrequentColor = mostFrequentColors[0].color;
    const [r, g, b] = mostFrequentColor;

    if (mostFrequentColors.slice(1).some((color) => !isSimilar(color.color, mostFrequentColor, 64))) {
        return overlayFallback();
    }

    const innerColorsRaw: Array<ImageDataLike['data']> = [
        context.getImageData(edgeSize, edgeSize, width - 2 * edgeSize, height - 2 * edgeSize).data,
    ];

    const innerColorsRgb = innerColorsRaw.map((innerColors) => {
        const colors: Rgb[] = [];
        for (let i = 0; i < innerColors.length; i += 4) {
            colors.push([innerColors[i], innerColors[i + 1], innerColors[i + 2]]);
        }
        return colors;
    }).flat();

    const nonBackgroundColorCount: Record<string, number> = {};

    innerColorsRgb.forEach((color) => {
        if (!isSimilar(color, [r, g, b])) {
            const colorKey = color.join(',');
            if (nonBackgroundColorCount[colorKey]) {
                nonBackgroundColorCount[colorKey]++;
            } else {
                nonBackgroundColorCount[colorKey] = 1;
            }
        }
    });

    if (Object.keys(nonBackgroundColorCount).length === 0) {
        return overlayFallback();
    }

    const mostFrequentNonBackgroundColor = Object.keys(nonBackgroundColorCount)
        .reduce((a, c) => (nonBackgroundColorCount[a] > nonBackgroundColorCount[c] ? a : c), Object.keys(nonBackgroundColorCount)[0]);

    const [nr, ng, nb] = mostFrequentNonBackgroundColor.split(',').map(Number) as Rgb;

    const imageData = context.getImageData(0, 0, width, height);

    for (let i = 0; i < imageData.data.length; i += 4) {
        if (isSimilar([imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]] as Rgb, [r, g, b], 64)) {
            imageData.data[i] = 0;
            imageData.data[i + 1] = 0;
            imageData.data[i + 2] = 0;
            imageData.data[i + 3] = 0;
        }
    }

    context.putImageData(imageData, 0, 0);

    if (isSimilar([nr, ng, nb], [0, 0, 0], 64) || (isSimilar([nr, ng, nb], [255, 255, 255], 64) && !isSimilar([r, g, b], [0, 0, 0], 64))) {
        for (let i = 0; i < imageData.data.length; i += 4) {
            if (isSimilar([imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]] as Rgb, [nr, ng, nb], 64)) {
                imageData.data[i] = r;
                imageData.data[i + 1] = g;
                imageData.data[i + 2] = b;
            }
        }

        context.putImageData(imageData, 0, 0);
    }

    const { backgroundCanvas, backgroundContext } = makeBackground();
    const gradient = backgroundContext.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgb(49, 49, 49)');
    gradient.addColorStop(1, 'rgb(20, 20, 20)');
    backgroundContext.fillStyle = gradient;
    backgroundContext.fillRect(0, 0, width, height);

    backgroundContext.globalCompositeOperation = 'source-over';
    backgroundContext.drawImage(baseCanvas as unknown as CanvasImageSource, 0, 0);

    return backgroundCanvas;
}
