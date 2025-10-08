// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import vercel from '@astrojs/vercel/serverless';
import i18n from 'astro-i18n-aut/integration';

// https://astro.build/config
const defaultLocale = "id";
const locales = {
  en: "en-US", // the `defaultLocale` value must present in `locales` keys
  id: "id-ID",
};

export default defineConfig({
    output: 'server',
    adapter: vercel({}),
    vite: {
        plugins: [tailwindcss()],
    },
    integrations: [
    i18n({
        locales,
        defaultLocale,
    }),
  ],
});
