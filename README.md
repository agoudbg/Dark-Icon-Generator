# Dark Icon Generator

Dark Icon Generator is a tool to convert light icons to dark icons using Node.js. Works quite like Apple's iOS 18 dark app icons. 

![Example](./example.png)

## Installation

You can install the package using npm or yarn:

```bash
npm install dark-icon-generator
```

```bash
yarn add dark-icon-generator
```

## Usage

To convert a light icon to a dark icon, you can use the `convertDarkIcon` function: 
    
```javascript
import { convertDarkIcon } from 'dark-icon-generator';
import * as fs from 'fs';

async function convertIcon() {
    const iconPath = 'path/to/light/icon.png';
    const icon = fs.readFileSync(iconPath);
    const darkIcon = await convertDarkIcon(icon);
    fs.writeFileSync('path/to/dark/icon.png', darkIcon);
}

convertIcon();
```

## Browser usage

The package ships a browser-friendly entry point that avoids the Node.js `canvas` dependency. Import the browser build and pass a URL, `File`, `Blob`, or `ImageBitmap`; you will get back a `Blob` you can show directly.

```html
<script type="module">
    import { convertDarkIcon } from 'dark-icon-generator/browser';

    const input = document.querySelector('input[type=file]');
    const preview = document.querySelector('#dark-preview');

    input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) return;

            const blob = await convertDarkIcon(file);
            preview.src = URL.createObjectURL(blob);
    });
    </script>
```

Run the local browser demo after building:

```bash
npm install
npm run build
npx http-server examples/browser  # or any static server
```

Then open http://localhost:8080 to try the in-browser converter.
