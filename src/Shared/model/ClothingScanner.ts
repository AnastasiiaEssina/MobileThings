import { Folder, ImageSource, isAndroid, knownFolders, path } from '@nativescript/core';
import { fromNativeSource } from '@nativescript/core/image-source';
import { isAvailable, requestCameraPermissions, takePicture } from '@nativescript/camera';

declare const android: any;

const MAX_IMAGE_SIZE = 1200;
const BACKGROUND_THRESHOLD = 46;
const BRIGHT_BACKGROUND_THRESHOLD = 24;
const CROP_MARGIN = 26;

type Rgb = {
  r: number;
  g: number;
  b: number;
};

function channelDistance(a: Rgb, b: Rgb) {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
}

function getRgb(pixel: number): Rgb {
  return {
    r: (pixel >>> 16) & 255,
    g: (pixel >>> 8) & 255,
    b: pixel & 255,
  };
}

function alpha(pixel: number) {
  return (pixel >>> 24) & 255;
}

function withAlpha(pixel: number, nextAlpha: number) {
  return ((nextAlpha & 255) << 24) | (pixel & 0x00ffffff);
}

function median(values: number[]) {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 255;
}

function estimateBackgroundColor(pixels: number[], width: number, height: number): Rgb {
  const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 24));
  const reds: number[] = [];
  const greens: number[] = [];
  const blues: number[] = [];

  function addSample(index: number) {
    const color = getRgb(pixels[index]);
    reds.push(color.r);
    greens.push(color.g);
    blues.push(color.b);
  }

  for (let x = 0; x < width; x += sampleStep) {
    addSample(x);
    addSample((height - 1) * width + x);
  }

  for (let y = 0; y < height; y += sampleStep) {
    addSample(y * width);
    addSample(y * width + width - 1);
  }

  return {
    r: median(reds),
    g: median(greens),
    b: median(blues),
  };
}

function getBackgroundThreshold(backgroundColor: Rgb) {
  const brightness = (backgroundColor.r + backgroundColor.g + backgroundColor.b) / 3;
  return brightness > 238 ? BRIGHT_BACKGROUND_THRESHOLD : BACKGROUND_THRESHOLD;
}

function isBackgroundCandidate(pixel: number, backgroundColor: Rgb, threshold: number) {
  if (alpha(pixel) < 16) {
    return true;
  }

  return channelDistance(getRgb(pixel), backgroundColor) <= threshold;
}

function removeBackgroundFromAndroidBitmap(bitmap: any) {
  const scaledBitmap =
    Math.max(bitmap.getWidth(), bitmap.getHeight()) > MAX_IMAGE_SIZE
      ? android.graphics.Bitmap.createScaledBitmap(
          bitmap,
          Math.round((bitmap.getWidth() / Math.max(bitmap.getWidth(), bitmap.getHeight())) * MAX_IMAGE_SIZE),
          Math.round((bitmap.getHeight() / Math.max(bitmap.getWidth(), bitmap.getHeight())) * MAX_IMAGE_SIZE),
          true
        )
      : bitmap;

  const width = scaledBitmap.getWidth();
  const height = scaledBitmap.getHeight();
  const pixels = Array.create('int', width * height) as number[];
  scaledBitmap.getPixels(pixels, 0, width, 0, 0, width, height);

  const backgroundColor = estimateBackgroundColor(pixels, width, height);
  const backgroundThreshold = getBackgroundThreshold(backgroundColor);
  const background = new Uint8Array(width * height);
  const stack: number[] = [];

  function queue(index: number) {
    if (background[index]) {
      return;
    }

    if (!isBackgroundCandidate(pixels[index], backgroundColor, backgroundThreshold)) {
      return;
    }

    background[index] = 1;
    stack.push(index);
  }

  for (let x = 0; x < width; x += 1) {
    queue(x);
    queue((height - 1) * width + x);
  }

  for (let y = 0; y < height; y += 1) {
    queue(y * width);
    queue(y * width + width - 1);
  }

  while (stack.length) {
    const index = stack.pop() as number;
    const x = index % width;
    const y = Math.floor(index / width);

    if (x > 0) {
      queue(index - 1);
    }
    if (x < width - 1) {
      queue(index + 1);
    }
    if (y > 0) {
      queue(index - width);
    }
    if (y < height - 1) {
      queue(index + width);
    }
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let index = 0; index < pixels.length; index += 1) {
    if (background[index]) {
      pixels[index] = withAlpha(pixels[index], 0);
      continue;
    }

    if (alpha(pixels[index]) < 16) {
      pixels[index] = withAlpha(pixels[index], 0);
      continue;
    }

    const x = index % width;
    const y = Math.floor(index / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (maxX < minX || maxY < minY) {
    return scaledBitmap;
  }

  minX = Math.max(0, minX - CROP_MARGIN);
  minY = Math.max(0, minY - CROP_MARGIN);
  maxX = Math.min(width - 1, maxX + CROP_MARGIN);
  maxY = Math.min(height - 1, maxY + CROP_MARGIN);

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const croppedPixels = Array.create('int', cropWidth * cropHeight) as number[];

  for (let y = 0; y < cropHeight; y += 1) {
    for (let x = 0; x < cropWidth; x += 1) {
      croppedPixels[y * cropWidth + x] = pixels[(minY + y) * width + minX + x];
    }
  }

  const outputBitmap = android.graphics.Bitmap.createBitmap(
    cropWidth,
    cropHeight,
    android.graphics.Bitmap.Config.ARGB_8888
  );
  outputBitmap.setPixels(croppedPixels, 0, cropWidth, 0, 0, cropWidth, cropHeight);
  return outputBitmap;
}

async function removeBackground(imageSource: ImageSource) {
  if (!isAndroid || !imageSource.android) {
    return imageSource;
  }

  return fromNativeSource(removeBackgroundFromAndroidBitmap(imageSource.android));
}

function getOutputPath() {
  const folder = Folder.fromPath(path.join(knownFolders.documents().path, 'custom-clothes'));
  return path.join(folder.path, `clothing-${Date.now()}.png`);
}

export async function scanClothingImage() {
  if (!isAvailable()) {
    throw new Error('Камера недоступна на этом устройстве.');
  }

  const permissions = await requestCameraPermissions();
  if (!permissions.Success) {
    throw new Error('Разрешите доступ к камере, чтобы добавить вещь.');
  }

  const asset = await takePicture({
    width: 1400,
    height: 1400,
    keepAspectRatio: true,
    saveToGallery: false,
    cameraFacing: 'rear',
  });
  const source = await ImageSource.fromAsset(asset);
  const processedSource = await removeBackground(source);
  const imagePath = getOutputPath();
  const saved = await processedSource.saveToFileAsync(imagePath, 'png', 100);

  if (!saved) {
    throw new Error('Не получилось сохранить снимок.');
  }

  return imagePath;
}
