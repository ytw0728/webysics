import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 3000,
        hmr: true,
        open: true,
    },
    plugins: [
        createHtmlPlugin({
            entry: 'src/index.ts',
            template: 'public/index.html',
        }),
        tsconfigPaths({ root: './' })
    ],
    build: {
        rollupOptions: {
            input: {
                main: './public/index.html',
            },
        },
        assetsDir: './public/assets',
    },
})