export const checkImageQuality = (imageData) => {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);
            const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // brightness
            let totalBrightness = 0;
            for (let i = 0; i < data.length; i += 4) {
                totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
            }
            const avgBrightness = totalBrightness / (data.length / 4);

            // blur (laplacian)
            const gray = [];
            for (let i = 0; i < data.length; i += 4) {
                gray.push((data[i] + data[i + 1] + data[i + 2]) / 3);
            }

            const width = canvas.width;
            const height = canvas.height;
            let lapVar = 0;

            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = y * width + x;
                    const lap =
                        4 * gray[idx] -
                        gray[idx - 1] -
                        gray[idx + 1] -
                        gray[idx - width] -
                        gray[idx + width];

                    lapVar += lap * lap;
                }
            }

            lapVar = lapVar / ((width - 2) * (height - 2));

            resolve({
                brightness: avgBrightness,
                sharpness: lapVar,
                isBlurry: lapVar < 100,
                isTooLight: avgBrightness > 200,
                isTooDark: avgBrightness < 50,
            });
        };

        img.src = imageData;
    });
};
