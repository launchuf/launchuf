import { z } from "zod";
import {
  COMPANY_TYPE_VALUES, CONTENT_VALUES, FEATURE_VALUES, GOAL_VALUES, HEARD_VALUES, IMAGERY_VALUES, STYLE_VALUES,
} from "@/lib/brief";

const text = (max: number) => z.string().trim().max(max).default("");

export const orderSchema = z.object({
  packageCode: z.enum(["start", "growth", "premium", "uf"]),

  // Kontakt
  companyName: z.string().trim().min(2, "Skriv företagsnamn").max(120),
  contactName: z.string().trim().min(2, "Skriv kontaktperson").max(120),
  email: z.string().trim().email("Ogiltig e-postadress").max(255),
  phone: text(40),
  companyType: z.enum(COMPANY_TYPE_VALUES).default("uf"),
  city: text(80),
  heardFrom: z.enum(HEARD_VALUES).optional(),

  // Om verksamheten
  description: z.string().trim().min(10, "Beskriv verksamheten (minst 10 tecken)").max(2000),
  audience: text(1000),
  usp: text(1000),
  goal: z.enum(GOAL_VALUES).default("contact"),

  // Innehåll
  pages: z.array(z.string().trim().min(1).max(60)).max(15).default([]),
  pagesNote: text(1000),
  features: z.array(z.enum(FEATURE_VALUES)).max(20).default([]),
  featuresNote: text(1000),
  moreWork: z.boolean().default(false),
  contentSource: z.enum(CONTENT_VALUES).default("mix"),
  languages: text(120),
  contactDetailsToShow: text(500),

  // Design
  style: z.enum(STYLE_VALUES).default("modern"),
  colors: text(500),
  mood: text(1000),
  imagery: z.enum(IMAGERY_VALUES).default("unsure"),
  references: text(1500),
  dislikes: text(1000),
  hasBrandGuide: z.boolean().default(false),

  // Länkar & lansering
  instagram: text(120),
  tiktok: text(120),
  otherLinks: text(500),
  existingWebsite: text(200),
  domainOption: z.enum(["none", "owned", "setup"]).default("none"),
  domainName: text(120),
  launchDate: z.string().date().optional().or(z.literal("")),
  extra: text(2000),

  // Betalning & samtycke
  payNow: z.boolean().default(false),
  consent: z.literal(true, { errorMap: () => ({ message: "Du måste godkänna hanteringen av uppgifter" }) }),

  logo: z
    .object({
      dataUrl: z.string().max(7_200_000),
      fileName: z.string().trim().min(1).max(180),
      mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
    })
    .nullable()
    .default(null),

  // Spamskydd
  website: z.string().max(200).optional().default(""),
  elapsedMs: z.number().optional(),
  turnstileToken: z.string().max(2048).optional(),
});

export type OrderInput = z.input<typeof orderSchema>;
export type OrderData = z.output<typeof orderSchema>;
