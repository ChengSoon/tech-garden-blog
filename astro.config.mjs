// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://blog.lzch.eu.org',
  integrations: [mdx(), react()],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'everforest-light',
        dark: 'everforest-dark',
      },
      defaultColor: false,
      wrap: true,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
