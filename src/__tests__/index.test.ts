import * as path from 'path';
import { convertDarkIcon } from '../index';
import * as fs from 'fs';

const imageCount = 3;

async function testConvertDarkIcon() {
    for (let i = 1; i <= imageCount; i++) {
        const imagePath = path.join(__dirname, `./img/${i}.png`);
        const image = fs.readFileSync(imagePath);
        const result = await convertDarkIcon(image);
        fs.writeFileSync(path.join(__dirname, `./img/${i}-dark.png`), result);
    }
}

test('convertDarkIcon', testConvertDarkIcon, 20000);
