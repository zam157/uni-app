import path from 'path'
import fs from 'fs-extra'
import {
  emptyDir,
  normalizePath,
  parseManifestJsonOnce,
  parseVueRequest,
  resolveMainPathOnce,
  resolveUTSCompiler,
} from '@dcloudio/uni-cli-shared'
import type { Plugin } from 'vite'
import { parseImports, uvueOutDir } from './utils'

const REMOVED_PLUGINS = [
  'vite:build-metadata',
  'vite:modulepreload-polyfill',
  'vite:css',
  'vite:esbuild',
  'vite:json',
  'vite:wasm-helper',
  'vite:worker',
  'vite:asset',
  'vite:wasm-fallback',
  'vite:define',
  'vite:css-post',
  'vite:build-html',
  'vite:html-inline-proxy',
  'vite:worker-import-meta-url',
  'vite:asset-import-meta-url',
  'vite:force-systemjs-wrap-complete',
  'vite:watch-package-data',
  'commonjs',
  'vite:data-uri',
  'vite:dynamic-import-vars',
  'vite:import-glob',
  'vite:build-import-analysis',
  'vite:esbuild-transpile',
  'vite:terser',
  'vite:reporter',
]

export function uniAppUTSPlugin(): Plugin {
  const inputDir = process.env.UNI_INPUT_DIR
  const outputDir = process.env.UNI_OUTPUT_DIR
  const mainUTS = resolveMainPathOnce(inputDir)
  const tempOutputDir = uvueOutDir()
  const manifestJson = parseManifestJsonOnce(inputDir)

  // 开始编译时，清空输出目录
  function emptyOutDir() {
    if (fs.existsSync(outputDir)) {
      emptyDir(outputDir)
    }
  }
  emptyOutDir()
  return {
    name: 'uni:app-uts',
    apply: 'build',
    config() {
      return {
        base: '/', // 强制 base
        build: {
          outDir: tempOutputDir,
          lib: {
            // 必须使用 lib 模式
            fileName: 'output',
            entry: resolveMainPathOnce(inputDir),
            formats: ['cjs'],
          },
          rollupOptions: {
            external: ['vue', 'vuex', 'pinia'],
          },
        },
      }
    },
    configResolved(config) {
      const plugins = config.plugins as Plugin[]
      const len = plugins.length
      for (let i = len - 1; i >= 0; i--) {
        const plugin = plugins[i]
        if (REMOVED_PLUGINS.includes(plugin.name)) {
          plugins.splice(i, 1)
        }
      }
    },
    async transform(code, id) {
      const { filename } = parseVueRequest(id)
      if (!filename.endsWith('.uts')) {
        return
      }
      const isMainUTS = normalizePath(id) === mainUTS
      const fileName = path.relative(inputDir, id)
      this.emitFile({
        type: 'asset',
        fileName: normalizeFilename(fileName, isMainUTS),
        source: normalizeCode(code, isMainUTS),
      })
      code = await parseImports(code)
      return code
    },
    async writeBundle() {
      await resolveUTSCompiler().compileApp(
        path.join(tempOutputDir, 'index.uts'),
        {
          inputDir: tempOutputDir,
          outputDir: outputDir,
          package: 'uni.' + (manifestJson.appid || '').replace(/_/g, ''),
        }
      )
    },
  }
}

function normalizeFilename(filename: string, isMain = false) {
  if (isMain) {
    return 'index.uts'
  }
  return filename
}

function normalizeCode(code: string, isMain = false) {
  if (!isMain) {
    return code
  }
  return `
${code}  
export function main(app: IApp) {
    defineAppConfig();
    definePageRoutes();
    (createApp()['app'] as VueApp).mount(app);
}
`
}