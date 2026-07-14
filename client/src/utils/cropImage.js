// Canvas-based crop utility for use with react-easy-crop.
// Given an image URL and the pixel crop area react-easy-crop reports,
// this draws just that region onto a canvas and returns it as a Blob
// (JPEG), ready to be wrapped in a File and uploaded.

export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // needed to avoid canvas tainting when the image is loaded from a
    // blob: URL created via URL.createObjectURL — this is a local file,
    // not cross-origin, but setting it is harmless and keeps this utility
    // reusable if an image URL is ever passed in from elsewhere (e.g. Cloudinary)
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * @param {string} imageSrc - image url or blob: url
 * @param {{ x: number, y: number, width: number, height: number }} pixelCrop - from react-easy-crop's onCropComplete
 * @param {number} outputSize - final square output size in pixels (e.g. 500)
 * @returns {Promise<Blob>} - a JPEG blob of the cropped, resized square image
 */
export async function getCroppedImageBlob(imageSrc, pixelCrop, outputSize = 500) {
  const image = await createImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // draw only the cropped region from the source image, scaled to fill
  // the fixed-size square output canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.92
    );
  });
}
