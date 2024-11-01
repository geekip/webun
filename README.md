# Webun
基于`webpack5`的前端项目打包工具。项目源码：[https://github.com/geekip/webun](https://github.com/geekip/webun)

> 全局安装，随处使用。项目下无须安装各种编译依赖包，减少众多项目的`node_modules`占用磁盘空间。<br>
> 开箱即用零配置，默认开启编译缓存、多线程、代码压缩、代码分割等优化配置，同时也支持自定义配置。<br>
> 集成`bebel` `swc` `esbuild`，可根据需求自由选择，提升编译速度。<br>
> 开发调试模式监听文件变更自动刷新浏览器，集成`vue` `react` 的HMR热更新。

## 🛒全局安装
```shell
pnpm i webun -g 
```

## 💡进入项目
一个项目同时支持`react` `vue`共存，能编译`jsx` `tsx` `ts` `js` + `css` `less` `sass/scss` `styl`
```shell
# 查看使用帮助
webun -h
```
项目结构示例
```
├──public
├──src
|  ├──assets
|  |  ├──css
|  |  |  ├──var.less
|  |  |  ├──var.scss
|  |  |  ├──style.less
|  |  |  └──style.scss
|  |  ├──images
|  |  └──fonts
|  ├──... 
|  ├──App.vue
|  ├──App.jsx
|  ├──main.{js|ts|jsx|tsx}
|  ├──favicon.ico
|  └──index.html
├──...
├──package.json
└──webun.config.js
```

## 🐞开发调试
基于`webpack-dev-server`实现
```shell
# 快速调试，默认地址0.0.0.0，默认端口9527
webun
# 指定地址和端口
webun --host 0.0.0.0 --port 8080 
# 调式生产模式，默认无sourceMap
webun --mode production
```

## 📦编译打包
```shell
# 打包生产模式
webun build
# 打包开发模式，默认有sourceMap
webun build --mode development
```

## 🍃忽略缓存
默认开启编译缓存，提升编译速度，但有时修改配置后缓存会造成打包异常，需要忽略缓存进行编译
```shell
# 忽略缓存 --force 或 -f
webun --force
webun build -f
```

## 📑获取运行时环境变量
模式变量 `NODE_ENV`  值为：`development` or `production`<br>
操作变量 `NODE_ACT`  值为：`serve` or `build`<br>

- 在配置文件里使用
```javascript
const isServe = process.env.NODE_ACT === 'serve'
const isDev = process.env.NODE_ENV === 'development'
module.exports = {
  ...
  // 生产环境指定静态文件的地址
  output:{
    publicPath: isDev ? '' : 'http://cdn.com/',
  },
  // 开发环境开启 source-map
  devtool: isDev ? 'eval-cheap-module-source-map' : false,
  // 指定不同的自定义变量
  define:{
    api_base_url: isServe : 'http://localhost/api' : 'http://backend.com/api'
  }
  ...
}
```

- 在html模板里使用
```html
<!-- 获取运行时变量 -->
<%= process.env.NODE_ENV %>
```
- 在项目文件里使用
```javascript
// 获取运行时变量
const mode = process.env.NODE_ENV
console.log(mode)
console.log(api_base_url)
```

## 🔨配置
零配置即可使用！<br>
> 默认入口文件为`./src/index` 或 `./src/main`,支持mjs、js、jsx、ts、tsx、vue文件；<br>
> 自动扫描匹配html模板文件为`./src/index.html`<br>
> 自动扫描匹配favicon文件为`./src/favicon.ico`

### 配置文件
如需自定义配置，请在项目根目录创建配置文件 `./webun.config.js`
```javascript
// 配置文件格式
module.exports = {
  name: 'Webun Project',
  target: 'web',
  entry: './src/index',
  ...
}
// 或者
module.exports = function(command, mode){
  return {
    name: 'Webun Project',
    target: 'web',
    entry: './src/index',
    ...
  }
}
```

### name
`string`

项目名称，无配置时默认使用./package.json的`name`，参考[webpack.name](https://webpack.docschina.org/configuration/other-options/#name)

### target
`string`

指定运行环境，参考[webpack.target](https://webpack.docschina.org/configuration/target/#target)
```javascript
// 默认配置
module.exports = {
  ...
  target: ['web','es2015']
  ...
}
```

### stats
`string` `object`

控制 bundle 信息的显示模式，参考[webpack.stats](https://webpack.docschina.org/configuration/stats)
```javascript
// 默认配置
module.exports = {
  ...
  stats: 'errors-only'
  ...
}
```

### infrastructureLogging
`object`

控制 bundle 信息的显示模式，参考[webpack.infrastructurelogging](https://webpack.docschina.org/configuration/other-options/#infrastructurelogging)
```javascript
// 默认配置
module.exports = {
  ...
  infrastructureLogging: {
    level: "error"
  }
  ...
}
```

### define
`Object`

自定义全局变量，参考[webpack DefinePlugin](https://webpack.js.org/plugins/define-plugin/#root)
```javascript
// 配置文件
module.exports = {
  ...
  define: {
    test_string: 'test...',
    test_number: 123
  }
  ...
}

// 使用请参考上面的 `获取环境变量`
// ./src/main.js
console.log(test_string) 
```

### entry
`Array`

入口文件配置,参考 [webpack.entry](https://webpack.js.org/configuration/entry-context/#entry)<br>
自动读取`./src/index`或`./src/main`，后缀支持`.mjs` `.js` `.jsx` `.ts` `.tsx` `.vue`
```javascript
// 自定义配置
module.exports = {
  ...
  entry: {
    app_a: './src/app_a.js',
    app_b: './src/app_b.ts',
    app_c: './src/app_c'
  }
  ...
}
```

### dirs
`Object`

基础路径配置，不建议修改 <br>
```javascript
// 默认配置
module.exports = {
  ...
  entry: {
    src: './src',
    dist: './dist'
  }
  ...
}
```

### thread
`Boolean `

多线程编译，默认 `true`，大幅提升编译速度

### cache
`Boolean `

编译缓存，默认 `true`，大幅提升编译速度

### analyzer
`Boolean ` `Object`

编译分析，参考 [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

默认`false`
```javascript
// 设置为`false`时不开启
module.exports = {
  ...
  analyzer: false
  ...
}
// 设置为`true`时的默认配置
module.exports = {
  ...
  analyzer: {
    analyzerHost: '0.0.0.0',
    analyzerPort: 9528,
  }
  ...
}
```

### autoprefixer
`Boolean ` `Object`

css自动补全后缀，参考 [autoprefixer](https://github.com/postcss/autoprefixer)

默认`false`
```javascript
// 设置为`true`开启
module.exports = {
  ...
  autoprefixer: true
  ...
}
// 设置为`true`时的默认配置
module.exports = {
  ...
  autoprefixer: {
    overrideBrowserslist: [
      "iOS 7.1",
      "last 2 versions",
      ">0%"
    ],
    grid: true
  }
  ...
}
```

### globalStyle
`String` `Array` 

全局样式变量，参考 [sass-resources-loader](https://www.npmjs.com/package/sass-resources-loader)<br>

默认：`./src/assets/css/var.{less,scss,sass,styl}`，支持`globjs`规则匹配，会自动扫描和导入`./src/assets/css/`目录下的`var`文件，可根据不同的css rules自动注入全局样式变量。

```javascript
// 自定义配置 String
module.exports = {
  ...
  globalStyle: './src/style/var.*.less'
  ...
}
// 自定义配置 Array
module.exports = {
  ...
  globalStyle: [
    './src/less/var.*.less',
    './src/scss/var.scss'
  ]
  ...
}
```

### performance
`Boolean` `Object`

文件大小限制，参考[webpack.performance](https://webpack.js.org/configuration/performance/)
```javascript
// 默认配置
module.exports = {
  ...
  performance: {
    maxEntrypointSize: 10000000,
    maxAssetSize: 30000000
  }
  ...
}
// 关闭
module.exports = {
  ...
  performance: false
  ...
}
```

### assetMaxSize
`Number`

图片文件base64阈值，例如图片小于4kb就以base64输出，超过则会使用url输出。参考[Rule.parser.dataUrlCondition](https://webpack.js.org/configuration/module/#ruleparserdataurlcondition)

```javascript
// 默认配置
module.exports = {
  ...
  assetMaxSize: 4096
  ...
}
```

### templates
`Boolean` `Array`

html模板文件配置，支持多页面，为空则不打包html文件。参考 [html-webpack-plugin](https://www.npmjs.com/package/html-webpack-plugin)<br>
```javascript
// 不生成html
module.exports = {
  ...
  templates: false
  ...
}
```
```javascript
// 多页面示例配置
module.exports = {
  ...
  templates:[
    {
      template: 'src/a.html',
      chunks:['app_a']
    },
    {
      template: 'src/b.html',
      excludeChunks:['app_a']
    }
  ]
  ...
}
```

### externals
申明外部扩展,参考[webpack.externals](https://webpack.js.org/configuration/externals/#root)

### provide
`Object`

自动加载模块配置，在使用时将不再需要import和require进行引入，直接使用即可。参考 [webpack.providePlugin](https://webpack.js.org/plugins/provide-plugin/#root)

### resolve
`Object`

解析配置。参考 [webpack.resolve](https://webpack.js.org/configuration/resolve/)

```javascript
// 默认配置
module.exports = {
  ...
  resolve: {
    extensions: [
      '.mjs', '.js', '.jsx', '.ts', '.tsx', '.json', '.vue',
      '.css', '.less', '.sass', '.scss'
    ],
    alias: {
      '#' : path.resolve(__dirname),  
      '@' : path.resolve('src' ) 
    },
    mainFiles: ['index', 'main']
  },
  resolveLoader:{
    modules = [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(lib, 'node_modules')
    ]
  }
  ...
}
```

### fileName
`Object`

输出文件名配置，参考 [webpack.output.filename](https://webpack.js.org/guides/caching/#output-filenames)
```javascript
// 默认配置
module.exports = {
  ...
  fileName: {
    js: 'assets/js/[name].js',
    css: 'assets/css/[name].css',
    img: 'assets/img/[name][ext]',
    font: 'assets/font/[name][ext]',
    media: 'assets/media/[name][ext]',
  }
  ...
}
```

### devtool
`Boolean` `String` 

是否生成 `source map`，参考 [webpack.devtool](https://webpack.js.org/configuration/devtool)
```javascript
// 默认配置，生产环境不使用source map
const isDev = process.env.NODE_ENV === 'development'
module.exports = {
  ...
  devtool: isDev ? 'eval-cheap-module-source-map' : false
  ...
}
```

### devServer
`Object`

开发调试配置, 参考 [webpack.devtool](https://webpack.js.org/configuration/dev-server/#root)
```javascript
// 默认配置
module.exports = {
  ...
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
    static: './public'
  }
  ...
}
```

### jsLoader
`Object`

js编译配置，参考[babel](https://babeljs.io/) [swc](https://swc.rs/) [esbuild](https://esbuild.github.io/)
```javascript
// 默认配置
module.exports = {
  ...
  jsLoader: {
    // babel swc esbuild，推荐使用swc
    type: 'swc',
    target: 'es2015',
    jsx: {
      pragma: 'React.createElement',
      pragmaFrag: 'React.Fragment'
    }
  },
  ...
}
```

### output
`Object`

输出配置,参考[webpack.output](https://webpack.js.org/concepts/output/#root)
```javascript
// 默认配置
module.exports = {
  ...
  output: {
    filename: fileName.js,
    path: dirs.dist,
    clean: true,
    library: {
      name: '[name]',
      type: 'umd',
      umdNamedDefine: true
    }
  }
  ...
}
```

### copy
`Object`

静态文件复制，参考[CopyWebpackPlugin](https://webpack.js.org/plugins/copy-webpack-plugin)
```javascript
// 配置示例
module.exports = {
  ...
  copy: {
    patterns: [
      { from: 'public', to: 'public' }
    ]
  }
  ...
}
```

### minify
`Boolean` `Object`

代码压缩，使用`jsLoader`的配置压缩代码
```javascript
module.exports = {
  ...
  // 设置为`false`时不压缩代码
  minify: false
  ...
}

// 为`true`时的默认配置
module.exports = {
  ...
  minify: {
    // 移除注释
    drop_comments: true,
    // 移除console
    drop_console: false,
    // 移除debugger
    drop_debugger: true
  }
  ...
}
```

### splitChunks

type `Boolean` `Object`

代码分割，参考[webpack.optimization.splitChunks](https://webpack.js.org/plugins/split-chunks-plugin/#optimizationsplitchunks)
```javascript
// 设置为`false`时不分割代码
module.exports = {
  ...
  splitChunks: false
  ...
}
// 设置为`true`时的默认配置
module.exports = {
  ...
  splitChunks: {
    chunks: 'all',
    minSize: 102400,
    maxSize: 1843200,
    minChunks: 1,
    maxAsyncRequests: 10,
    maxInitialRequests: 10,
    automaticNameDelimiter: '-',
    cacheGroups: {
      vue: {
        name: 'chunk-vue',
        test: /[\\/]node_modules[\\/](vue.*|@vue.*)[\\/]/,
        priority: 50
      },
      react: {
        name: 'chunk-react',
        test: /[\\/]node_modules[\\/](react.*|redux.*|scheduler|@reduxjs.*|immer|history)[\\/]/,
        priority: 40,
        reuseExistingChunk: true,
        minSize: 0
      },
      polyfill: {
        name: 'chunk-polyfill',
        test: /[\\/]node_modules[\\/](core-js|@babel\/runtime|@swc\/helpers|tslib)[\\/]/,
        priority: 30
      },
      vendors: {
        name: 'chunk-vendors',
        test: /[\\/]node_modules[\\/]/,
        priority: -10,
        chunks: 'initial'
      },
      common: {
        name: 'chunk-common',
        minChunks: 2,
        priority: -20,
        chunks: 'initial',
        reuseExistingChunk: true
      }
    }
  }
  ...
}
```
