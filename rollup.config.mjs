import swc from '@rollup/plugin-swc'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import externals from 'rollup-plugin-node-externals'
const isProduction = process.env.mode === 'production'
// import { builtinModules } from 'module';
// console.log(builtinModules);
export default {
  input: [
    './src/index.js',
    './src/cli.js'
  ],
  output: {
    dir: './lib',
    format: 'cjs'
  },
  plugins: [
    json(),
    externals({
      deps: true
    }),
    resolve(),
    swc({
      swc: {
        jsc: {
          target: 'es5'
        },
        // minify: true
      }
    }),
    commonjs(),
    isProduction && terser()
  ].filter(Boolean)
}

