export const bookingServices = {
  "Extensão de cílios — Volume Power": {
    durationService: "Extensão de cílios",
    priceCents: 19790,
  },
  "Extensão de cílios — Volume Express": {
    durationService: "Extensão de cílios",
    priceCents: 10000,
  },
  "Extensão de cílios — Volume Brasileiro": {
    durationService: "Extensão de cílios",
    priceCents: 15000,
  },
  "Extensão de cílios — Volume Luxo": {
    durationService: "Extensão de cílios",
    priceCents: 17000,
  },
  "Extensão de cílios — Volume Glamour": {
    durationService: "Extensão de cílios",
    priceCents: 16000,
  },
  "Extensão de cílios — Volume Luxuoso": {
    durationService: "Extensão de cílios",
    priceCents: 21000,
  },
  "Extensão de cílios — Fox Eyes": {
    durationService: "Extensão de cílios",
    priceCents: 19000,
  },
  "Manutenção de cílios — Volume Power": {
    durationService: "Manutenção de cílios",
    priceCents: 13000,
  },
  "Manutenção de cílios — Volume Brasileiro": {
    durationService: "Manutenção de cílios",
    priceCents: 10000,
  },
  "Manutenção de cílios — Volume Luxo": {
    durationService: "Manutenção de cílios",
    priceCents: 11000,
  },
  "Manutenção de cílios — Volume Glamour": {
    durationService: "Manutenção de cílios",
    priceCents: 10000,
  },
  "Manutenção de cílios — Volume Luxuoso": {
    durationService: "Manutenção de cílios",
    priceCents: 15000,
  },
  "Manutenção de cílios — Fox Eyes": {
    durationService: "Manutenção de cílios",
    priceCents: 13000,
  },
  "Design de sobrancelhas com henna": {
    durationService: "Procedimentos estéticos",
    priceCents: 5500,
  },
  "Design de sobrancelhas personalizado": {
    durationService: "Procedimentos estéticos",
    priceCents: 4000,
  },
  "Hidra Gloss — 1 sessão": {
    durationService: "Procedimentos estéticos",
    priceCents: 12000,
  },
  "Hidra Gloss — 3 sessões": {
    durationService: "Procedimentos estéticos",
    priceCents: 29000,
  },
  "SPA Labial — 1 sessão": {
    durationService: "Procedimentos estéticos",
    priceCents: 6000,
  },
  "SPA Labial — 3 sessões": {
    durationService: "Procedimentos estéticos",
    priceCents: 15000,
  },
  "BB Clean": {
    durationService: "Procedimentos estéticos",
    priceCents: 14990,
  },
  "Skin Detox": {
    durationService: "Procedimentos estéticos",
    priceCents: 11000,
  },
  "Revitalize": {
    durationService: "Procedimentos estéticos",
    priceCents: 9000,
  },
  "DLT Facial": {
    durationService: "Procedimentos estéticos",
    priceCents: 9000,
  },
  "DLT Facial — protocolo 2 (catálogo)": {
    durationService: "Procedimentos estéticos",
    priceCents: 17500,
  },
  "DLT Facial — protocolo 3 (catálogo)": {
    durationService: "Procedimentos estéticos",
    priceCents: 18900,
  },
  "Glow Frequency": {
    durationService: "Procedimentos estéticos",
    priceCents: 10000,
  },
  "Firm Frequency": {
    durationService: "Procedimentos estéticos",
    priceCents: 19790,
  },
  "Drain Body Relax": {
    durationService: "Procedimentos estéticos",
    priceCents: 14790,
  },
  "Detox corporal": {
    durationService: "Procedimentos estéticos",
    priceCents: 8000,
  },
  "Mantex corporal": {
    durationService: "Procedimentos estéticos",
    priceCents: 9000,
  },
} as const;

export const receiptMimeTypes = {
  "image/jpeg": { extension: "jpg", signature: [0xff, 0xd8, 0xff] },
  "image/png": { extension: "png", signature: [0x89, 0x50, 0x4e, 0x47] },
  "image/webp": { extension: "webp", signature: [0x52, 0x49, 0x46, 0x46] },
  "application/pdf": { extension: "pdf", signature: [0x25, 0x50, 0x44, 0x46] },
} as const;

export const receiptMaxBytes = 5 * 1024 * 1024;
