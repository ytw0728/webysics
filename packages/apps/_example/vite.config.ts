import BaseConfig from '@webysics-monorepo/vite-config/build'

import { mergeConfig, defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import tsconfigPaths from 'vite-tsconfig-paths'

export default mergeConfig(
    BaseConfig,
    defineConfig({
        plugins: [
            createHtmlPlugin({
                template: './public/index.html',
                entry: './src/index.ts'
            }),
            tsconfigPaths({
                root: './'
            })
        ]
    }),
)