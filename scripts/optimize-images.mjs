import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

async function optimizeImages() {
    console.log('Starting image optimization...');

    try {
        const files = await fs.readdir(ICONS_DIR);

        for (const file of files) {
            if (file.match(/\.(png|jpg|jpeg)$/i)) {
                const filePath = path.join(ICONS_DIR, file);
                const fileName = path.parse(file).name;
                const webpPath = path.join(ICONS_DIR, `${fileName}.webp`);

                // Skip if webp already exists
                try {
                    await fs.access(webpPath);
                    console.log(`Skipping ${file}, WebP already exists.`);
                    continue;
                } catch {
                    // File doesn't exist, proceed
                }

                console.log(`Optimizing ${file} -> ${fileName}.webp`);
                await sharp(filePath)
                    .webp({ quality: 80 })
                    .toFile(webpPath);
            }
        }
        console.log('Image optimization complete!');
    } catch (error) {
        console.error('Error optimizing images:', error);
    }
}

optimizeImages();
