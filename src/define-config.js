import fs from 'fs'
import path from 'path'
import glob from 'fast-glob'
import { rimrafSync } from 'rimraf'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import miniCssExtractPlugin from 'mini-css-extract-plugin'
import cssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import autoprefixerPlugin from 'autoprefixer'
import TerserPlugin from 'terser-webpack-plugin'
import { EsbuildPlugin } from 'esbuild-loader';
import CopyWebpackPlugin from 'copy-webpack-plugin'
import WebpackBar from 'webpackbar'
import { VueLoaderPlugin } from 'vue-loader'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import { cwd, lib, libModules, type, merge, logger, mergeConfig, cacheDir } from './utils'
import getDefaultConfig from './config.js'

export default class DefineConfig {
  /**
   * get webpack config
   *
   * @param {String} command process.argv
   * @param {Object} usrConfig 
   *
   * @return {Object} webpack configs
   */
  constructor(usrConfig = {}) {
    this.usrConfig = usrConfig
    this.defaultConfig = getDefaultConfig(usrConfig)
    this.config = mergeConfig({ ...this.defaultConfig }, usrConfig)
    const {
      command, mode, name, stats, infrastructureLogging,
      entry, performance, externals, devtool
    } = this.config
    this.isServe = command === 'serve'
    this.isDev = mode === 'development'
    this.dirs = this.getDirs()
    this.templates = this.getTemplates()
    this.globalStyles = this.getGlobalStyles()

    const webpackConfig = {
      // https://webpack.docschina.org/configuration/other-options/#name
      name,
      // https://webpack.docschina.org/configuration/mode/#root
      mode,
      // https://webpack.docschina.org/configuration/stats/
      stats,
      // https://webpack.docschina.org/configuration/other-options/#infrastructurelogging
      infrastructureLogging,
      // https://webpack.docschina.org/concepts/entry-points#root
      entry,
      // https://webpack.docschina.org/configuration/cache/#root
      cache: this.getCache(),
      // https://webpack.docschina.org/configuration/target/#target
      target: this.getTarget(),
      // https://webpack.docschina.org/configuration/output/#root
      output: this.getOutput(),
      // https://webpack.docschina.org/configuration/resolve/#root
      resolve: this.getResolve(),
      // https://webpack.docschina.org/configuration/resolve/#resolveloader
      resolveLoader: this.getResolveLoader(),
      // https://webpack.docschina.org/configuration/module/#root
      module: this.getModule(),
      // https://webpack.docschina.org/concepts/plugins#root
      plugins: this.getPlugins()
    }

    if (performance) {
      webpackConfig.performance = performance
    }
    // https://webpack.docschina.org/configuration/externals#externals
    if (externals) {
      webpackConfig.externals = externals
    }
    // https://webpack.docschina.org/configuration/devtool/#root
    if (devtool) {
      webpackConfig.devtool = devtool
    }
    // https://webpack.docschina.org/configuration/dev-server/#root
    if (this.isServe) {
      webpackConfig.devServer = this.getDevServer()
      webpackConfig.watchOptions = {
        ignored: /node_modules/
      }
    }
    if (!this.isDev) {
      // https://webpack.docschina.org/configuration/optimization/#root
      webpackConfig.optimization = this.getOptimization()
    }
    return webpackConfig
  }

  getCache() {
    const { cache, jsLoader = {} } = this.config
    if (!cache || this.usrConfig.force) {
      return false
    }
    if (cache.type === 'filesystem') {
      cache.cacheDirectory = this.dirs.cache.webpack
      const jsLoaderType = jsLoader.type || 'babel'
      cache.name = `${jsLoaderType}-${this.config.mode}`
    }
    return cache
  }

  getTarget() {
    let { target, jsLoader = {} } = this.config
    const loaderTarget = jsLoader.target
    if (!target) {
      target = ['web']
    } else if (!type(target).isArray) {
      target = [target]
    }
    if (loaderTarget && !target.includes(loaderTarget)) {
      target.push(loaderTarget)
    }
    return target
  }

  getDevServer() {
    const { devServer } = this.config
    // watch html templates
    const watchFiles = []
    this.templates.forEach(({ template }) => {
      template && watchFiles.push(template)
    })
    if (watchFiles.length) {
      devServer.watchFiles = watchFiles
    }
    return devServer
  }

  getDirs() {
    const { mode, dirs, cache } = this.config
    if (!type(dirs).isObject) {
      logger('error', `Config Error: The dirs must be of type Object`)
      process.exit(1)
    }
    Object.entries(dirs).forEach(([key, dir]) => {
      if (!type(dir).isString) {
        logger('error', `Config Error: The '${key} path' must be of type string `)
        process.exit(1)
      }
      if (key === 'dist') {
        dir = `${dir}/${mode}`
      }
      dirs[key] = path.resolve(cwd, dir)
    })
    if (!fs.existsSync(dirs.src)) {
      logger('error', `Config Error: The src path '${dirs.src}' does not exist`)
      process.exit(1)
    }
    let _cacheDir = cacheDir
    if (cache && cache.type === 'filesystem') {
      const { cacheLocation, cacheDirectory } = cache
      if (cacheLocation) {
        _cacheDir = path.resolve(cwd, cacheLocation)
        delete cache.cacheLocation
      } else if (cacheDirectory) {
        _cacheDir = path.resolve(cwd, cacheDirectory)
      }
    }
    dirs.cache = {
      webpack: path.resolve(_cacheDir, 'webpack'),
      babel: path.resolve(_cacheDir, 'babel')
    }
    if (this.usrConfig.force && fs.existsSync(_cacheDir)) {
      rimrafSync(_cacheDir)
    }
    return dirs
  }

  makeTemplate(html = {}) {
    const { template, favicon } = html
    if (!html.hasOwnProperty('hash')) {
      html.hash = true
    }
    if (!html.hasOwnProperty('filename') && template) {
      html.filename = path.basename(template)
    }
    if (favicon) {
      const faviconFile = path.resolve(cwd, favicon)
      if (fs.existsSync(faviconFile)) {
        html.favicon = faviconFile
      } else {
        delete html.favicon
        logger('warning', `Config Warning: The favicon path '${faviconFile}' does not exist`)
      }
    } else {
      const faviconFile = path.resolve(cwd, './src/favicon.ico')
      if (fs.existsSync(faviconFile)) {
        html.favicon = faviconFile
      }
    }
    return html
  }

  getTemplates() {
    // default templates
    if (!this.usrConfig.hasOwnProperty('templates')) {
      let template = path.posix.join(cwd, './src/index.html')
      if (fs.existsSync(template)) {
        return [this.makeTemplate({ template })]
      }
      return [this.makeTemplate({ title: this.config.name })]
    }
    const { templates = [] } = this.config
    if (type(templates).isArray) {
      return templates.map(item => {
        const { template } = item
        if (template) {
          const file = path.posix.join(cwd, template)
          if (fs.existsSync(file)) {
            item.template = file
          } else {
            logger('warning', `Config warning: The template path '${file}' does not exist`)
            return
          }
        }
        return this.makeTemplate(item)
      }).filter(Boolean)
    }
    logger('warning', `Config warning: The templates must be of type Array`)
    return []
  }

  getGlobalStyles() {
    const make = (str, check = true) => {
      const files = glob.sync(str)
      if (check && !files.length) {
        logger('error', `Config Error: The globalStyle path '${str}' does not exist`)
        process.exit(1)
      }
      return files.map(file => {
        file = path.posix.join(cwd, file)
        let ext = path.extname(file)
        return { [ext]: file }
      })
    }
    // default config
    if (!this.usrConfig.hasOwnProperty('globalStyle')) {
      return make(this.defaultConfig.globalStyle, false)
    }

    // user config
    let styles = []
    let { globalStyle } = this.config
    if (type(globalStyle).isString) {
      styles = make(globalStyle)
    } else if (type(globalStyle).isArray) {
      globalStyle = Array.from(new Set(globalStyle))
      globalStyle.forEach(file => styles.push(...make(file)))
    } else {
      logger('warning', `Config Warning: The globalStyle must be of type String or Array`)
    }
    return styles
  }

  getOutput() {
    const { output = {} } = this.config
    return merge({
      filename: this.resolveStaticPath('js'),
      path: this.dirs.dist
    }, output)
  }

  getResolve() {
    const { resolve = {} } = this.config
    return merge({
      alias: {
        '#': cwd,
        '@': this.dirs.src
      }
    }, resolve)
  }

  getResolveLoader() {
    const { resolveLoader = {} } = this.config
    const loader = {}
    if (cwd != lib) {
      const cwdModules = path.resolve(cwd, 'node_modules')
      loader.modules = [cwdModules, libModules]
    }
    return merge(loader, resolveLoader)
  }
  getOptimization() {
    const optimization = { minimize: false }
    const { minify, splitChunks, jsLoader = {} } = this.config
    if (minify) {
      optimization.minimize = true
      const minimizer = []
      if (jsLoader.type === 'esbuild') {
        minimizer.push(new EsbuildPlugin({ css: true }))
      } else {
        minimizer.push(new cssMinimizerPlugin())
        const options = {}
        if (jsLoader.type === 'swc') {
          options.minify = TerserPlugin.swcMinify
        }
        if (type(minify).isObject) {
          const { drop_comments, drop_console, drop_debugger } = minify
          const comments = !drop_comments
          options.terserOptions = {
            format: { comments },
            compress: { unused: true, drop_console, drop_debugger },
            mangle: true
          }
          options.extractComments = comments
        }
        minimizer.push(new TerserPlugin(options))
      }
      optimization.minimizer = minimizer
    }
    if (splitChunks) {
      // 合并相同的 chunk
      optimization.mergeDuplicateChunks = true
      // 抽取在运行环境中，对模块进行解析、加载、模块信息相关的代码
      optimization.runtimeChunk = 'single'
      // 关键错误会被发送到生成的代码中，并会在运行时报错
      optimization.emitOnErrors = true
      // https://webpack.docschina.org/plugins/split-chunks-plugin#optimizationsplitchunks
      optimization.splitChunks = splitChunks
    }
    return optimization
  }

  getPlugins() {
    const { isDev, config, templates } = this
    const { command, mode, provide, copy, define, analyzer, devServer = {}, jsLoader = {} } = config
    let jsLoaderType = jsLoader.type
    if (!['babel', 'swc', 'esbuild'].includes(jsLoaderType)) {
      jsLoaderType = 'babel'
    }
    const plugins = [
      // https://webpack.docschina.org/plugins/mini-css-extract-plugin#root
      new miniCssExtractPlugin({
        filename: this.resolveStaticPath('css')
      }),
      // https://webpack.docschina.org/plugins/module-concatenation-plugin/#root
      new webpack.optimize.ModuleConcatenationPlugin(),
      new VueLoaderPlugin(),
      new WebpackBar({ name: `Webun ${command} ${mode} (${jsLoaderType})` })
    ]
    if (isDev && devServer.hot) {
      plugins.push(new ReactRefreshWebpackPlugin({ exclude: [/node_modules/] }))
    }
    // https://webpack.docschina.org/plugins/provide-plugin/#root
    if (provide) {
      if (!type(provide).isObject) {
        logger('error', `Config Error: The provide must be of type Object`)
        process.exit(1)
      }
      if (Object.keys(provide).length) {
        plugins.push(new webpack.ProvidePlugin(provide))
      }
    }
    // https://webpack.docschina.org/plugins/copy-webpack-plugin#root
    if (copy) {
      if (!type(copy).isObject) {
        logger('error', `Config Error: The copy must be of type Object`)
        process.exit(1)
      }
      const patterns = copy.patterns
      if (patterns && patterns.length) {
        plugins.push(new CopyWebpackPlugin(copy))
      }
    }
    // https://webpack.docschina.org/plugins/define-plugin#root
    const defineOptions = merge({
      'process.env': {
        NODE_ENV: process.env.NODE_ENV,
        NODE_ACT: process.env.NODE_ACT
      }
    }, define)
    Object.entries(defineOptions).forEach(([key, val]) => {
      defineOptions[key] = JSON.stringify(val)
    })
    plugins.push(new webpack.DefinePlugin(defineOptions))

    templates.forEach(template => {
      plugins.push(new HtmlWebpackPlugin(template))
    })

    // https://github.com/webpack-contrib/webpack-bundle-analyzer
    if (analyzer) {
      analyzer.analyzerUrl = ({ listenHost, listenPort }) => {
        if (listenHost === '0.0.0.0' || listenHost === '127.0.0.1') {
          listenHost = 'localhost'
        }
        listenPort = listenPort === 80 ? '' : `:${listenPort}`
        return `http://${listenHost}${listenPort}`
      }
      plugins.push(new BundleAnalyzerPlugin(analyzer))
    }
    return plugins
  }

  getModule() {
    const { thread, assetMaxSize, module = {} } = this.config
    const threadLoader = thread && 'thread-loader'
    return merge({
      rules: [
        {
          test: /\.vue$/,
          use: [threadLoader, 'vue-loader'].filter(Boolean)
        },
        {
          oneOf: [
            { test: /\.m?js$/, ...this.getJsLoader('js') },
            { test: /\.ts$/, ...this.getJsLoader('ts') },
            { test: /\.jsx$/, ...this.getJsLoader('jsx') },
            { test: /\.tsx$/, ...this.getJsLoader('tsx') },
            { test: /\.css$/, ...this.getStyleLoader('css') },
            { test: /\.less$/, ...this.getStyleLoader('less') },
            { test: /\.sass/, ...this.getStyleLoader('sass') },
            { test: /\.scss$/, ...this.getStyleLoader('scss') },
            { test: /\.styl$/, ...this.getStyleLoader('styl') },
            {
              test: /\.(png|jpe?g|bmp|webp|gif|ico|svg|tif|tiff)(\?.*)?$/,
              ...this.getAssetLoader('img', 'asset', assetMaxSize)
            },
            {
              test: /\.(woff2?|eot|ttf|otf|ttc)(\?.*)?$/,
              ...this.getAssetLoader('font', 'asset/resource')
            },
            {
              test: /\.(mp4|webm|ogg|mov|mp3|m4a|wav|flac|aac)(\?.*)?$/,
              ...this.getAssetLoader('media', 'asset/resource')
            },
            { resourceQuery: /raw/, type: 'asset/source' }
          ]
        }
      ]
    }, module)
  }

  getJsLoader(suffix) {
    const jsLoaderType = this.config.jsLoader
    const threadLoader = this.config.thread && 'thread-loader'
    const suffixMap = {
      react: suffix.includes('sx'),
      ts: suffix.includes('ts')
    }
    let loader
    if (jsLoaderType === 'esbuild') {
      loader = this.getEsbuildLoader(suffixMap)
    } else if (jsLoaderType === 'swc') {
      loader = this.getSwcLoader(suffixMap)
    } else {
      const babels = this.getBabelLoaders()
      loader = this.getBabelLoader(suffixMap, babels)
    }
    return {
      exclude: /node_modules/,
      use: [threadLoader, loader].filter(Boolean)
    }
  }
  getEsbuildLoader({ react, ts }) {
    const { jsx = {}, target } = this.config.jsLoader
    const { pragma, pragmaFrag } = jsx
    let loader = (ts ? 't' : 'j') + 's'
    if (react) {
      loader += 'x'
    }
    const options = {
      loader,
      target
    }
    if (pragma) {
      options.jsxFactory = pragma
    }
    if (pragmaFrag) {
      options.jsxFragment = pragmaFrag
    }
    return {
      loader: 'esbuild-loader',
      options
    }
  }
  getSwcLoader({ react, ts }) {
    const { devServer = {}, jsLoader = {} } = this.config
    const { jsx = {}, target } = jsLoader
    const jsc = {
      parser: {
        syntax: ts ? 'typescript' : 'ecmascript',
        decorators: true
      },
      transform: {
        legacyDecorator: true,
        decoratorMetadata: true,
      },
      externalHelpers: true,
      target,
      loose: true,
    }

    if (react) {
      const { pragma, pragmaFrag } = jsx
      const reactOptions = {
        runtime: 'automatic',
        throwIfNamespace: true,
        useBuiltins: true,
        development: this.isDev,
        refresh: this.isDev && devServer.hot
      }
      if (pragma) {
        reactOptions.pragma = pragma
      }
      if (pragmaFrag) {
        reactOptions.pragmaFrag = pragmaFrag
      }
      jsc.transform.react = reactOptions
      jsc.parser[(ts ? 't' : 'j') + 'sx'] = true
    }
    return {
      loader: 'swc-loader',
      options: {
        jsc,
        isModule: 'unknown'
      }
    }
  }

  getBabelLoader({ react, ts }, babels) {
    const { devServer = {} } = this.config
    const { options } = babels
    const presets = [...babels.presets.js]
    const plugins = [...babels.plugins.js]

    if (react) {
      presets.push(...babels.presets.react)
      plugins.push(...babels.plugins.react)
      if (this.isDev && devServer.hot) {
        const refresh = require.resolve('react-refresh/babel')
        plugins.push(refresh)
      }
    }

    if (ts) {
      presets.push(...babels.presets.ts)
      plugins.push(...babels.plugins.ts)
    }

    // https://github.com/babel/babel-loader
    return {
      loader: 'babel-loader',
      options: { ...options, presets, plugins }
    }
  }

  getBabelLoaders() {
    const { cache, jsLoader = {} } = this.config
    const { jsx = {} } = jsLoader
    const needCache = cache && !this.usrConfig.force
    const options = {
      compact: true,
      cacheDirectory: needCache ? this.dirs.cache.babel : false,
      cacheCompression: false,
    }
    const getPlugin = (name, option) => {
      if (cwd !== lib) {
        name = path.resolve(libModules, name)
      }
      const plugin = [name]
      option && plugin.push(option)
      return plugin
    }
    const loose = { loose: true }
    return {
      options,
      presets: {
        js: [
          // https://babeljs.io/docs/babel-preset-env
          getPlugin('@babel/preset-env', { ...loose, bugfixes: true, modules: false })
        ],
        ts: [
          // https://babeljs.io/docs/babel-preset-typescript
          getPlugin('@babel/preset-typescript', ...jsx)
        ],
        react: [
          // https://www.babeljs.cn/docs/babel-preset-react
          getPlugin('@babel/preset-react', { runtime: 'automatic', ...jsx })
        ]
      },
      plugins: {
        js: [
          // https://www.babeljs.cn/docs/babel-plugin-proposal-decorators
          getPlugin('@babel/plugin-proposal-decorators', { legacy: true }),
          // https://www.babeljs.cn/docs/babel-plugin-transform-class-properties
          getPlugin('@babel/plugin-transform-class-properties', loose),
          // https://www.babeljs.cn/docs/babel-plugin-transform-runtime
          getPlugin('@babel/plugin-transform-runtime', { absoluteRuntime: lib, useESModules: true }),
          // https://www.babeljs.cn/docs/babel-plugin-transform-private-methods
          getPlugin('@babel/plugin-transform-private-methods', loose),
          // https://www.babeljs.cn/docs/babel-plugin-transform-private-property-in-object
          getPlugin('@babel/plugin-transform-private-property-in-object', loose)
        ],
        ts: [],
        react: []
      }
    }
  }
  getStyleLoader(suffix = 'css') {
    const styleLoader = this.isDev ? 'style-loader' : miniCssExtractPlugin.loader
    const cssLoader = 'css-loader'

    const postcssPlugins = []
    const { autoprefixer } = this.config
    autoprefixer && postcssPlugins.push(autoprefixerPlugin(autoprefixer))

    const postcssLoader = !!postcssPlugins.length && {
      loader: 'postcss-loader',
      options: {
        postcssOptions: { plugins: postcssPlugins }
      }
    }

    const loaderMaps = {
      less: 'less-loader',
      sass: 'sass-loader',
      scss: 'sass-loader',
      styl: 'stylus-loader'
    }
    const suffixLoader = loaderMaps[suffix]

    // get globalStyles
    const patterns = []
    this.globalStyles.forEach(globalStyle => {
      const file = globalStyle[`.${suffix}`]
      file && patterns.push(file)
    })
    // add globalStyle
    const styleResourcesLoader = !!patterns.length && {
      loader: 'style-resources-loader',
      options: { patterns }
    }

    return {
      // exclude: /node_modules/,
      use: [
        styleLoader,
        cssLoader,
        postcssLoader,
        suffixLoader,
        styleResourcesLoader
      ].filter(Boolean)
    }
  }

  getAssetLoader(name, type, maxSize) {
    const options = {
      type,
      generator: {
        filename: this.resolveStaticPath(name)
      }
    }
    if (maxSize) {
      options.parser = {
        dataUrlCondition: { maxSize }
      }
    }
    return options
  }
  resolveStaticPath(name) {
    let fileName = this.config.fileName[name]
    if (!fileName) {
      fileName = '[name][ext]'
    }
    return fileName
  }
  getConfig(keys) {
    return keys.split('.').reduce((acc, key) => {
      return acc && acc[key]
    }, this.config)
  }
  checkConfig(keys) {
    const flag = '_no_own_property'
    return keys.split('.').reduce((acc, key) => {
      return acc && acc.hasOwnProperty(key) ? acc[key] : flag
    }, this.usrConfig) !== flag
  }
}