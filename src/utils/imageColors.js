/**
 * Extracts the dominant color from an image URL.
 * @param {string} imageUrl - The URL of the image.
 * @returns {Promise<string>} - A promise that resolves to the hex color string.
 */
export const getDominantColor = (imageUrl) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Downscale for performance
                canvas.width = 50;
                canvas.height = 50;

                ctx.drawImage(img, 0, 0, 50, 50);

                // Simple version: just take the center pixel or average a few
                // better version: average of center area

                const imageData = ctx.getImageData(0, 0, 50, 50).data;
                let r = 0, g = 0, b = 0, count = 0;

                for (let i = 0; i < imageData.length; i += 4) {
                    if (imageData[i + 3] > 128) { // Ignore transparent pixels
                        r += imageData[i];
                        g += imageData[i + 1];
                        b += imageData[i + 2];
                        count++;
                    }
                }

                if (count > 0) {
                    r = Math.floor(r / count);
                    g = Math.floor(g / count);
                    b = Math.floor(b / count);
                    resolve(`rgb(${r}, ${g}, ${b})`);
                } else {
                    resolve(null); // No opaque pixels or error
                }

            } catch (e) {
                console.warn("Color extraction failed", e);
                resolve(null);
            }
        };

        img.onerror = () => {
            // Cannot extract color (e.g. CORS or broken link)
            resolve(null);
        };
    });
};
