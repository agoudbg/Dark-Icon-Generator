import { createCanvas, loadImage } from 'canvas';

// icon: string/Buffer/Uint8Array
export type IconInput = string | Buffer | Uint8Array;

function isSimilar(color1: number[], color2: number[], colorTolerance = 32) {
    return Math.abs(color1[0] - color2[0]) < colorTolerance &&
        Math.abs(color1[1] - color2[1]) < colorTolerance &&
        Math.abs(color1[2] - color2[2]) < colorTolerance;
};

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

    // Get the fallback method ready.
    const fallback = () => {
        // Draw a rectangle on the canvas.
        context.globalCompositeOperation = 'source-over';
        context.fillStyle = 'rgba(0, 0, 0, 0.1)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const darkIcon = canvas.toBuffer('image/png');

        return darkIcon;
    }

    // Get the color data of the icon at the edges.
    const { width, height } = canvas;
    const edgeSize = 0.05 * Math.min(width, height);

    const edgeColorsRaw = [
        context.getImageData(0, 0, edgeSize, height).data,
        context.getImageData(width - edgeSize, 0, edgeSize, height).data,
        context.getImageData(0, 0, width, edgeSize).data,
        context.getImageData(0, height - edgeSize, width, edgeSize).data,
    ];

    // Merge the color data into an array of RGB colors.
    const edgeColorsRgb = edgeColorsRaw.map((edgeColors) => {
        const colors = [];
        for (let i = 0; i < edgeColors.length; i += 4) {
            colors.push([edgeColors[i], edgeColors[i + 1], edgeColors[i + 2]]);
        }
        return colors;
    }).flat();

    // Get background color.
    const colorCount: { [key: string]: number } = {};

    edgeColorsRgb.forEach((color) => {
        const colorKey = color.join(',');
        if (colorCount[colorKey]) {
            colorCount[colorKey]++;
        } else {
            colorCount[colorKey] = 1;
        }
    });

    const sortedColors = Object.keys(colorCount).sort((a, b) => colorCount[b] - colorCount[a]);
    const mostFrequentColors = sortedColors.slice(0, 5).map(color => ({
        color: color.split(',').map(Number),
        count: colorCount[color],
    }));

    const mostFrequentColor = mostFrequentColors[0].color;
    const [r, g, b] = mostFrequentColor;

    // If the most frequent colors are much different from each other, fallback.
    if (mostFrequentColors.splice(1).some(color => !isSimilar(color.color, mostFrequentColor, 64))) {
        return fallback();
    }

    // Get the color data of the icon excluding the edges.
    const innerColorsRaw = [
        context.getImageData(edgeSize, edgeSize, width - 2 * edgeSize, height - 2 * edgeSize).data,
    ];

    // Merge the color data into an array of RGB colors.
    const innerColorsRgb = innerColorsRaw.map((innerColors) => {
        const colors = [];
        for (let i = 0; i < innerColors.length; i += 4) {
            colors.push([innerColors[i], innerColors[i + 1], innerColors[i + 2]]);
        }
        return colors;
    }).flat();

    // Find the most frequent color excluding the background color.

    const nonBackgroundColorCount: { [key: string]: number } = {};

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
        return fallback();
    }

    const mostFrequentNonBackgroundColor = Object.keys(nonBackgroundColorCount).reduce((a, b) => nonBackgroundColorCount[a] > nonBackgroundColorCount[b] ? a : b, Object.keys(nonBackgroundColorCount)[0]);
    const [nr, ng, nb] = mostFrequentNonBackgroundColor.split(',').map(Number);

    // Replace the most frequent background color with #00000000.
    const imageData = context.getImageData(0, 0, width, height);

    for (let i = 0; i < imageData.data.length; i += 4) {
        if (isSimilar([imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]], [r, g, b], 64)) {
            imageData.data[i] = 0;
            imageData.data[i + 1] = 0;
            imageData.data[i + 2] = 0;
            imageData.data[i + 3] = 0;
        }
    }

    context.putImageData(imageData, 0, 0);

    // If the most frequent non-background color is similar with dark or if the most frequent non-background color is similar with white and background color is not similar with dark,
    // replace the color to background color in canvas.
    if (isSimilar([nr, ng, nb], [0, 0, 0], 64) || (isSimilar([nr, ng, nb], [255, 255, 255], 64) && !isSimilar([r, g, b], [0, 0, 0], 64))) {
        for (let i = 0; i < imageData.data.length; i += 4) {
            if (isSimilar([imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]], [nr, ng, nb], 64)) {
                imageData.data[i] = r;
                imageData.data[i + 1] = g;
                imageData.data[i + 2] = b;
            }
        }

        context.putImageData(imageData, 0, 0);
    }

    // Draw the icon on a linear gradient.
    const backgroundCanvas = createCanvas(width, height);
    const backgroundContext = backgroundCanvas.getContext('2d');
    const gradient = backgroundContext.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `rgb(49, 49, 49)`);
    gradient.addColorStop(1, 'rgb(20, 20, 20)');
    backgroundContext.fillStyle = gradient;
    backgroundContext.fillRect(0, 0, width, height);

    // Draw the icon on the background.
    backgroundContext.globalCompositeOperation = 'source-over';
    backgroundContext.drawImage(canvas, 0, 0);

    // Convert the canvas to a buffer.

    const darkIcon = backgroundCanvas.toBuffer('image/png');

    return darkIcon;
}