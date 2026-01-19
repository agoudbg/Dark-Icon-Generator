# Dark Icon Generator ✨🌓

**English** | [简体中文](README_zh.md)

Dark Icon Generator turns light icons into moody dark counterparts—similar to the new iOS 18 dark app icons. Give it an image, get a polished dark icon back. ⚡️

![Example](./example.png)

Live demo: [https://dark-icon-generator.pages.dev/](https://dark-icon-generator.pages.dev/) 🚀

## Why you’ll like it
- 🖼️ Simple input: Buffer, base64 string, URL, or browser file.
- 🌑 Smart background detection with gradient overlay to keep icons legible.
- 💻 Node build with `@napi-rs/canvas`; 🧩 browser build with zero native deps.
- 🧪 Tested with Jest; ships types and ESM/CJS/browser bundles.

## Installation

```bash
npm install dark-icon-generator
# or
pnpm add dark-icon-generator
yarn add dark-icon-generator
```

## Quickstart (Node)

```ts
import { convertDarkIcon } from 'dark-icon-generator';
import fs from 'node:fs';

async function main() {
    const lightIcon = fs.readFileSync('input.png');
    const darkIcon = await convertDarkIcon(lightIcon);
    fs.writeFileSync('output-dark.png', darkIcon);
}

main();
```

## Quickstart (Browser)

```html
<input type="file" id="icon" accept="image/*" />
<img id="preview" alt="Dark icon preview" />

<script type="module">
    import { convertDarkIcon } from 'dark-icon-generator/browser';

    const input = document.querySelector('#icon');
    const preview = document.querySelector('#preview');

    input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;

        const blob = await convertDarkIcon(file);
        preview.src = URL.createObjectURL(blob);
    });
    // Try it live: https://dark-icon-generator.pages.dev/
</script>
```

## API
- Node: `convertDarkIcon(icon: string | Buffer | Uint8Array): Promise<Buffer>` → PNG buffer
- Browser: `convertDarkIcon(image: string | Blob | File | ImageBitmap | HTMLImageElement): Promise<Blob>` → PNG blob

## Tips
- Input may be a base64 string in Node; otherwise pass a file buffer.
- Browser inputs accept URLs or user-uploaded files; returned Blob can be shown via `URL.createObjectURL`.
- For a local demo: `npm install && npm run build && npx http-server examples/browser` then open http://localhost:8080.
