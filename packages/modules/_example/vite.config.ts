import BaseConfig from '@webysics-monorepo/vite-config/library'
import { mergeConfig, defineConfig } from 'vite'

export default mergeConfig(
    BaseConfig,
    defineConfig({
        build: {
            lib: {
                entry: './src/index.ts'
            }
        }
    }),
)