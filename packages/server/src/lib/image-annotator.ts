import sharp from "sharp";

// ==============================
// 类型
// ==============================

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ==============================
// 标注主函数
// ==============================

/**
 * 在图片上叠加批改标注：
 * - 全对：图片中央绿色勾号
 * - 有错：每个错误字上红色椭圆圈
 *
 * 返回标注后的 JPEG Buffer。
 */
export async function annotateGradeImage(
  imageBuffer: Buffer,
  isAllCorrect: boolean,
  errorPositions: BoundingBox[],
): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const imgW = metadata.width ?? 800;
  const imgH = metadata.height ?? 600;

  const svg = isAllCorrect
    ? buildCheckmarkSvg(imgW, imgH)
    : buildErrorCirclesSvg(imgW, imgH, errorPositions);

  if (!svg) return imageBuffer;

  const svgBuffer = Buffer.from(svg);

  return sharp(imageBuffer)
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

// ==============================
// SVG 生成
// ==============================

/** 全对：中央绿色圆圈 + 勾号 */
function buildCheckmarkSvg(w: number, h: number): string {
  const cx = Math.round(w / 2);
  const cy = Math.round(h / 2);
  const r = Math.round(Math.min(w, h) * 0.22);
  const sw = Math.max(Math.round(r * 0.12), 6);

  // 勾号路径：相对于圆心
  const x1 = cx - Math.round(r * 0.45);
  const y1 = cy;
  const x2 = cx - Math.round(r * 0.15);
  const y2 = cy + Math.round(r * 0.4);
  const x3 = cx + Math.round(r * 0.5);
  const y3 = cy - Math.round(r * 0.35);

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#22c55e" stroke-width="${sw}" opacity="0.85"/>
  <path d="M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3}" fill="none" stroke="#22c55e" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
</svg>`;
}

/** 有错：每个错误位置画红色椭圆圈 */
function buildErrorCirclesSvg(
  w: number,
  h: number,
  positions: BoundingBox[],
): string {
  if (positions.length === 0) return "";

  const valid = positions.filter(
    (p) => p.width > 0 && p.height > 0,
  );
  if (valid.length === 0) return "";

  const ellipses = valid
    .map((p) => {
      const cx = Math.round(p.x + p.width / 2);
      const cy = Math.round(p.y + p.height / 2);
      const rx = Math.round(p.width / 2 + 8);
      const ry = Math.round(p.height / 2 + 8);
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#ef4444" stroke-width="4" opacity="0.85"/>`;
    })
    .join("\n  ");

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  ${ellipses}
</svg>`;
}
