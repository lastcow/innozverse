// Central configuration for the web app

export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.innozverse.com',
} as const;
