import path from "node:path";
import sharp from "sharp";

const RASTER = /\.(jpe?g|png)$/i;

export function webpSrc(src: string) {
  return src.replace(RASTER, ".webp");
}

export function originalName(src: string) {
  return src.split("/").pop() ?? "image";
}

export type PhotoShape = "portrait" | "landscape";

export async function photoLayout(src: string) {
  const file = path.join(process.cwd(), "public", src.replace(/^\//, ""));
  const { width = 1, height = 1 } = await sharp(file).metadata();
  const landscape = width >= height;
  return {
    width,
    height,
    shape: (landscape ? "landscape" : "portrait") as PhotoShape,
  };
}
