const configuredAppUrl = (
  import.meta.env.WEB_URL || process.env.WEB_URL || "https://app.woolet.cc"
).trim();

export const appUrl = (
  /^https?:\/\//i.test(configuredAppUrl)
    ? configuredAppUrl
    : `https://${configuredAppUrl}`
).replace(/\/+$/, "");
