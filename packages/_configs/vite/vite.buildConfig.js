/** @type { import('vite').UserConfig } */
module.exports = {
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: true,
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: './public/index.html',
      },
    },
    assetsDir: './public/assets',
  },
  cacheDir: './.vite',
}
