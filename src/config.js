export default function getDefaultConfig({ command, mode }) {
  // const isServe = command === 'serve'
  const isDev = mode === 'development'

  return {
    // https://webpack.docschina.org/configuration/other-options/#name
    name: 'Webun Project',
    // https://webpack.docschina.org/configuration/target/#target
    target: 'web',
    // https://webpack.docschina.org/configuration/stats/
    stats: 'errors-only',
    // https://webpack.docschina.org/configuration/other-options/#infrastructurelogging
    infrastructureLogging: {
      level: "error"
    },
    // https://webpack.docschina.org/plugins/define-plugin#root
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    },
    // https://webpack.docschina.org/concepts/entry-points#root
    // entry: './src/main',
    dirs: {
      src: 'src',
      dist: 'dist'
    },
    // https://webpack.docschina.org/loaders/thread-loader/#root
    thread: true,
    // https://webpack.docschina.org/configuration/cache/#root
    cache: {
      type: 'filesystem',
      allowCollectingMemory: true
    },
    // https://github.com/webpack-contrib/webpack-bundle-analyzer
    analyzer: {
      analyzerHost: '0.0.0.0',
      analyzerPort: 9528,
      openAnalyzer: false,
      __disabled__: true
    },

    // https://segmentfault.com/a/1190000023960072?sort=newest
    autoprefixer: {
      overrideBrowserslist: [
        "iOS 7.1",
        "last 2 versions",
        ">0%"
      ],
      grid: true,
      __disabled__: true
    },

    // https://www.npmjs.com/package/style-resources-loader
    // String Array
    globalStyle: './src/assets/css/var.{less,scss,sass,styl}',

    // https://webpack.docschina.org/configuration/performance/#root
    performance: {
      maxEntrypointSize: 10000000,
      maxAssetSize: 30000000
    },

    // 静态文件base64阈值 4kb
    assetMaxSize: 4096,

    // https://webpack.docschina.org/plugins/html-webpack-plugin/#root
    // templates: [],

    // https://webpack.docschina.org/configuration/externals#externals
    externals: null,

    // https://webpack.docschina.org/plugins/provide-plugin/#root
    provide: null,

    module: {
      // https://webpack.docschina.org/configuration/module/#modulenoparse
      // noParse: /(^vue$)|(^pinia$)|(^vue-router$)/,
      rules: []
    },

    // https://webpack.docschina.org/configuration/resolve/#root
    resolve: {
      extensions: [
        '.mjs', '.js', '.jsx', '.ts', '.tsx', '.json', '.vue',
        '.css', '.less', '.sass', '.scss', 'styl'
      ],
      alias: {},
      mainFiles: ['index', 'main']
    },
    resolveLoader: {},

    // https://webpack.docschina.org/guides/caching#output-filenames
    fileName: {
      js: 'assets/js/[name].js',
      css: 'assets/css/[name].css',
      img: 'assets/img/[name][ext]',
      font: 'assets/font/[name][ext]',
      media: 'assets/media/[name][ext]',
    },

    // https://webpack.docschina.org/configuration/devtool/#root
    devtool: isDev ? 'eval-cheap-module-source-map' : false,

    devServer: {
      allowedHosts: 'all',
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      client: {
        logging: 'error',
        overlay: true
      },
      hot: true,
      host: '0.0.0.0',
      port: 9527,
      historyApiFallback: true,
      // static: './public'
    },

    jsLoader: {
      // babel swc esbuild
      type: 'swc',
      target: 'es2015',
      jsx: {
        // pragma: 'React.createElement',
        // pragmaFrag: 'React.Fragment'
      }
    },

    output: {
      clean: true,
      // https://webpack.docschina.org/configuration/output/#outputlibrary
      library: {
        name: '[name]',
        type: 'umd',
        umdNamedDefine: true
      },
      // environment: {
      //   arrowFunction: false
      // }
      // publicPath: '',
    },

    // copy:{},

    minify: {
      drop_comments: true,
      drop_console: false,
      drop_debugger: true
    },

    splitChunks: {
      // 可选值：all，async 和 initial
      chunks: 'all',
      // 设置最小分割大小，小于100k的文件不分割（以 bytes 为单位）
      minSize: 102400,
      // 生成的块的最大大小，如果超过了这个限制，大块会被拆分成多个小块。
      maxSize: 1843200,
      // 拆分前必须共享模块的最小块数。
      minChunks: 1,
      // 按需加载时的最大并行请求数。
      maxAsyncRequests: 10,
      // 入口点的最大并行请求数
      maxInitialRequests: 10,
      // 指定默认名称的分隔符
      automaticNameDelimiter: '-',
      // 分包规则
      cacheGroups: {
        // vue全家桶
        vue: {
          name: 'chunk-vue',
          test: /[\\/]node_modules[\\/](vue.*|@vue.*)[\\/]/,
          priority: 50
        },
        // react全家桶
        react: {
          name: 'chunk-react',
          test: /[\\/]node_modules[\\/](react.*|redux.*|scheduler|@reduxjs.*|immer|history)[\\/]/,
          priority: 40,
          reuseExistingChunk: true,
          minSize: 0
        },
        // 低版本兼容
        polyfill: {
          name: 'chunk-polyfill',
          test: /[\\/]node_modules[\\/](core-js|@babel\/runtime|@swc\/helpers|tslib)[\\/]/,
          priority: 30
        },
        // 第三方库 将匹配到的 node_modules下加载的库 都打包到vendors下面
        vendors: {
          name: 'chunk-vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          chunks: 'initial'
        },
        // 当一个文件被引入超过两次的时候 也分包成一个文件
        common: {
          name: 'chunk-common',
          minChunks: 2,
          priority: -20,
          chunks: 'initial',
          reuseExistingChunk: true
        }
      },
      __disabled__: true
    }
  }

}
