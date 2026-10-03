import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { Certificate } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { GREAT_VIBES_BASE64 } from "./fonts/great-vibes";

const BLUE = rgb(0.075, 0.227, 0.608);
const BLUE_DARK = rgb(0.05, 0.16, 0.46);
const BLUE_LIGHT = rgb(0.36, 0.52, 0.82);
const INK = rgb(0.07, 0.09, 0.16);
const SLATE = rgb(0.28, 0.33, 0.41);
const WHITE = rgb(1, 1, 1);

const W = 792;
const H = 612;
const CX = W / 2;

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
  script: PDFFont;
  scriptFallback: PDFFont;
}

function textWidth(font: PDFFont, text: string, size: number, spacing = 0): number {
  return font.widthOfTextAtSize(text, size) + spacing * Math.max(text.length - 1, 0);
}

function drawCentered(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color = INK,
  spacing = 0,
  centerX = CX
) {
  if (spacing === 0) {
    page.drawText(text, { x: centerX - textWidth(font, text, size) / 2, y, size, font, color });
    return;
  }
  let x = centerX - textWidth(font, text, size, spacing) / 2;
  for (const ch of text) {
    page.drawText(ch, { x, y, size, font, color });
    x += font.widthOfTextAtSize(ch, size) + spacing;
  }
}

function fitSize(font: PDFFont, text: string, maxSize: number, minSize: number, maxWidth: number) {
  let size = maxSize;
  while (size > minSize && textWidth(font, text, size) > maxWidth) size -= 1;
  return size;
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && textWidth(font, candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws with top-left-origin coordinates (SVG style) by anchoring the path at the page's top-left. */
function drawScreenPath(
  page: PDFPage,
  path: string,
  options: { fill?: ReturnType<typeof rgb>; stroke?: ReturnType<typeof rgb>; width?: number }
) {
  page.drawSvgPath(path, {
    x: 0,
    y: H,
    color: options.fill,
    borderColor: options.stroke,
    borderWidth: options.stroke ? options.width ?? 1 : 0,
  });
}

function drawBorder(page: PDFPage) {
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: BLUE, borderWidth: 2.5 });
  page.drawRectangle({ x: 28, y: 28, width: W - 56, height: H - 56, borderColor: BLUE, borderWidth: 0.8 });

  // Scroll-style corner ornaments, mirrored into all four corners.
  const inset = 38;
  for (const [flipX, flipY] of [
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ] as const) {
    const px = (x: number) => (flipX ? W - x : x);
    const py = (y: number) => (flipY ? H - y : y);
    const curve = (a: number, b: number) =>
      `M ${px(inset)} ${py(inset + b)} C ${px(inset)} ${py(inset + b * 0.45)} ${px(inset + b * 0.45)} ${py(inset)} ${px(inset + b)} ${py(inset)}` +
      ` M ${px(inset)} ${py(inset + a)} C ${px(inset)} ${py(inset + a * 0.5)} ${px(inset + a * 0.5)} ${py(inset)} ${px(inset + a)} ${py(inset)}`;
    drawScreenPath(page, curve(34, 64), { stroke: BLUE, width: 1.4 });
    page.drawCircle({ x: px(inset + 4), y: H - py(inset + 4), size: 3.2, color: BLUE });
    page.drawCircle({ x: px(inset + 72), y: H - py(inset), size: 1.8, color: BLUE_LIGHT });
    page.drawCircle({ x: px(inset), y: H - py(inset + 72), size: 1.8, color: BLUE_LIGHT });
  }
}

function drawSeal(page: PDFPage, cx: number, cy: number) {
  const ribbon = (dir: 1 | -1) => {
    const pts: [number, number][] = [
      [cx + dir * 4, cy - 18],
      [cx + dir * 26, cy - 14],
      [cx + dir * 30, cy - 66],
      [cx + dir * 17, cy - 55],
      [cx + dir * 6, cy - 67],
    ];
    return "M " + pts.map(([x, y]) => `${x} ${H - y}`).join(" L ") + " Z";
  };
  drawScreenPath(page, ribbon(-1), { fill: BLUE_LIGHT });
  drawScreenPath(page, ribbon(1), { fill: BLUE });

  page.drawCircle({ x: cx, y: cy, size: 37, color: BLUE });
  page.drawCircle({ x: cx, y: cy, size: 31, borderColor: WHITE, borderWidth: 1.2 });
  page.drawCircle({ x: cx, y: cy, size: 27, color: BLUE_DARK });

  const star = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 15 : 6.5;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${cx + r * Math.cos(a)} ${H - (cy + r * Math.sin(a))}`;
  });
  drawScreenPath(page, "M " + star.join(" L ") + " Z", { fill: WHITE });
}

function drawSignature(
  page: PDFPage,
  centerX: number,
  name: string,
  label: string,
  fonts: Fonts
) {
  const lineY = 222;
  page.drawLine({
    start: { x: centerX - 82, y: lineY },
    end: { x: centerX + 82, y: lineY },
    thickness: 0.9,
    color: SLATE,
  });
  const size = fitSize(fonts.bold, name, 13, 8, 180);
  drawCentered(page, name, lineY - 17, fonts.bold, size, BLUE_DARK, 0, centerX);
  drawCentered(page, label, lineY - 31, fonts.regular, 9.5, SLATE, 0, centerX);
}

/**
 * Renders a certificate as a landscape-letter PDF using pdf-lib (not
 * pdfkit): pdf-lib's standard fonts are generated programmatically instead
 * of read from disk via `__dirname`-relative paths, which is what breaks
 * pdfkit under Turbopack's server bundling. The script font used for the
 * recipient's name is embedded in the code for the same reason.
 */
export async function generateCertificatePdf(
  certificate: Certificate,
  qrPngDataUrl: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const page = pdfDoc.addPage([W, H]);

  const fonts: Fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    mono: await pdfDoc.embedFont(StandardFonts.CourierBold),
    script: await pdfDoc.embedFont(Buffer.from(GREAT_VIBES_BASE64, "base64"), { subset: true }),
    scriptFallback: await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
  };

  drawBorder(page);

  drawCentered(page, "CERTIFICATE OF COMPLETION", 500, fonts.bold, 27, BLUE, 2.2);
  page.drawLine({ start: { x: CX - 70, y: 486 }, end: { x: CX + 70, y: 486 }, thickness: 1, color: BLUE_LIGHT });
  page.drawCircle({ x: CX, y: 486, size: 2.4, color: BLUE });

  drawCentered(page, "This Certificate is awarded to", 452, fonts.regular, 13, INK);

  const supported = new Set(fonts.script.getCharacterSet());
  const scriptOk = [...certificate.recipientName].every((ch) => supported.has(ch.codePointAt(0) as number));
  const nameFont = scriptOk ? fonts.script : fonts.scriptFallback;
  const nameSize = fitSize(nameFont, certificate.recipientName, scriptOk ? 54 : 40, 24, 560);
  drawCentered(page, certificate.recipientName, 386, nameFont, nameSize, BLUE);

  const issueDate = formatDate(certificate.issueDate, "long");
  const validity = certificate.expirationDate
    ? ` It is valid until ${formatDate(certificate.expirationDate, "long")}.`
    : "";
  const core =
    `In recognition of the successful completion of "${certificate.certificateTitle}". ` +
    `This certificate was issued by ${certificate.organizationName} on ${issueDate}.${validity}`;
  const verifyNote =
    " Its authenticity can be confirmed at any time by scanning the QR code or by entering the Certificate ID on the verification page.";
  // Keep the paragraph to four lines so it never runs into the seal: shrink
  // the text first, and for extreme titles drop the closing sentence.
  let bodySize = 11.5;
  let lines = wrapText(fonts.regular, core + verifyNote, bodySize, 520);
  if (lines.length > 4) {
    bodySize = 10.5;
    lines = wrapText(fonts.regular, core + verifyNote, bodySize, 540);
  }
  if (lines.length > 4) lines = wrapText(fonts.regular, core, bodySize, 540);
  lines.slice(0, 4).forEach((line, i) => drawCentered(page, line, 342 - i * 16, fonts.regular, bodySize, SLATE));

  drawSignature(page, 152, certificate.issuedBy, "Issued By", fonts);
  drawSignature(page, W - 152, certificate.organizationName, "Issuing Institution", fonts);
  drawSeal(page, CX, 228);

  const leftX = 60;
  page.drawText("CERTIFICATE ID", { x: leftX, y: 130, size: 7.5, font: fonts.bold, color: BLUE });
  page.drawText(certificate.certificateNumber, { x: leftX, y: 112, size: 15, font: fonts.mono, color: INK });
  page.drawText(`Issue Date: ${issueDate}`, { x: leftX, y: 94, size: 9, font: fonts.regular, color: SLATE });
  page.drawText(`Blockchain Tx: ${certificate.blockchain.transactionHash}`, {
    x: leftX,
    y: 78,
    size: 6.3,
    font: fonts.regular,
    color: SLATE,
  });
  page.drawText(`Verify: ${certificate.verificationUrl}`, {
    x: leftX,
    y: 66,
    size: 6.3,
    font: fonts.regular,
    color: SLATE,
  });

  const qrBase64 = qrPngDataUrl.split(",")[1] ?? "";
  const qrImage = await pdfDoc.embedPng(Uint8Array.from(Buffer.from(qrBase64, "base64")));
  const qrSize = 82;
  const qrX = W - 112 - qrSize;
  page.drawImage(qrImage, { x: qrX, y: 58, width: qrSize, height: qrSize });
  page.drawRectangle({ x: qrX, y: 58, width: qrSize, height: qrSize, borderColor: BLUE_LIGHT, borderWidth: 0.8 });
  drawCentered(page, "SCAN TO VERIFY", 47, fonts.bold, 7, BLUE, 1, qrX + qrSize / 2);

  return pdfDoc.save();
}
