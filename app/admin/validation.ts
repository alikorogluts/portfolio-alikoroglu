import { z } from "zod";

export function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function emptyToNull(value: unknown) {
  const trimmed = trimString(value);
  return trimmed ? trimmed : null;
}

export function optionalBoolean(value: unknown) {
  return value === "on" || value === "true" || value === true;
}

export function optionalNumber(value: unknown, fallback = 0) {
  const trimmed = trimString(value);
  if (!trimmed) return fallback;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function optionalCommaSeparatedArray(value: unknown) {
  return trimString(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function isMailtoUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "mailto:";
  } catch {
    return false;
  }
}

function isSafePublicPath(value: string) {
  if (!value.startsWith("/")) return false;
  if (value.includes("..") || value.includes("\\")) return false;

  return value.startsWith("/uploads/") || value.startsWith("/images/") || /^\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value);
}

export const requiredString = (label: string) =>
  z.preprocess(trimString, z.string().min(1, `${label} is required.`));

export const optionalTrimmedString = z.preprocess(emptyToNull, z.string().nullable());

export const optionalEmail = z.preprocess(
  emptyToNull,
  z.string().email("Enter a valid email address.").nullable(),
);

export const requiredEmail = z.preprocess(
  trimString,
  z.string().email("Enter a valid email address."),
);

export const optionalAbsoluteUrl = z.preprocess(
  emptyToNull,
  z
    .string()
    .refine((value) => isHttpsUrl(value), "Enter a valid HTTPS URL.")
    .nullable(),
);

export const optionalPublicAssetPath = z.preprocess(
  emptyToNull,
  z
    .string()
    .refine((value) => isSafePublicPath(value), "Enter a valid public asset path.")
    .nullable(),
);

export const optionalUrlOrAssetPath = z.preprocess(
  emptyToNull,
  z
    .string()
    .refine((value) => isHttpsUrl(value) || isSafePublicPath(value), "Enter an HTTPS URL or public asset path.")
    .nullable(),
);

export const optionalHrefWithMailto = z.preprocess(
  emptyToNull,
  z
    .string()
    .refine((value) => isHttpsUrl(value) || isSafePublicPath(value) || isMailtoUrl(value), "Enter HTTPS, mailto, or public asset path.")
    .nullable(),
);

export const optionalInteger = (fallback = 0) =>
  z.preprocess((value) => optionalNumber(value, fallback), z.number().int());

export const checkboxBoolean = z.preprocess(optionalBoolean, z.boolean());

export const commaSeparatedArray = z.preprocess(optionalCommaSeparatedArray, z.array(z.string()));

export function validationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form fields and try again.";
}
