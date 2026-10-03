export { extractivePeerBriefing, type PeerBriefing } from "./peerBriefingShared";

export const MAX_ATTACHMENT_BYTES = 6 * 1024 * 1024;
export const MAX_ATTACHMENT_PAGES = 10;
const MAX_EXTRACTED_CHARS = 18_000;
const COMMISSION_HOST = "ec.europa.eu";
const DOWNLOAD_PREFIX = "/info/law/better-regulation/api/download/";

export function isAllowedPeerAttachmentUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname === COMMISSION_HOST && url.port === "" && url.pathname.startsWith(DOWNLOAD_PREFIX) && /^[A-Za-z0-9_-]{1,128}$/.test(url.pathname.slice(DOWNLOAD_PREFIX.length)) && !url.search && !url.hash;
  } catch { return false; }
}

/** Extract text with the maintained Node PDF parser, bounded to the published page count. */
export async function extractPdfText(buffer: Buffer, maxPages = MAX_ATTACHMENT_PAGES): Promise<string> {
  if (buffer.length < 5 || buffer.subarray(0, 5).toString() !== "%PDF-") return "";
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText({ partial: Array.from({ length: maxPages }, (_, i) => i + 1) });
    return String(result.text || "").replace(/\s+/g, " ").trim().slice(0, MAX_EXTRACTED_CHARS);
  } finally { await parser.destroy(); }
}
