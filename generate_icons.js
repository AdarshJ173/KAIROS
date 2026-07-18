import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Read our SVG content
  const svgPath = path.join(__dirname, 'public', 'logo.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  
  // Load SVG into the browser page with absolute dimensions and zero margin
  await page.setContent(`
    <html>
      <head>
        <style>
          body, html { margin: 0; padding: 0; background: transparent; overflow: hidden; }
          #logo { display: block; width: 512px; height: 512px; }
        </style>
      </head>
      <body>
        <div id="logo">${svgContent}</div>
      </body>
    </html>
  `);

  const logoElement = await page.$('#logo');
  if (!logoElement) {
    throw new Error("Logo element not found");
  }

  const sizes = [16, 32, 48, 128];
  
  for (const size of sizes) {
    // Resize viewport to match the icon size
    await page.setViewportSize({ width: size, height: size });
    
    // Scale the element container size to match the target size
    await page.evaluate(({ size }) => {
      const el = document.getElementById('logo');
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
    }, { size });
    
    const outputPath = path.join(__dirname, 'public', `icon${size}.png`);
    await logoElement.screenshot({
      path: outputPath,
      omitBackground: true
    });
    console.log(`Generated icon${size}.png`);
  }

  // Also generate a 48px version as favicon.png
  const faviconPath = path.join(__dirname, 'public', 'favicon.png');
  fs.copyFileSync(path.join(__dirname, 'public', 'icon48.png'), faviconPath);
  console.log('Generated favicon.png');

  await browser.close();
}

main().catch(console.error);
