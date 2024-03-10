import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import DefineConfig from './define-config'
import { cwd, lib, version, type, merge, logger, ipv4 ,cacheDir} from './utils'
export { cwd, lib, version, type, merge, logger,cacheDir }

/**
 * Run development server
 *
 * @param {Object} config  File source code
 * @param {Function} callback Options used
 *
 * @return {String}
 */
export function serve(config = {}, callback) {
  if (!config.mode) {
    config.mode = 'development'
  }
  config = new DefineConfig(config)
  const compiler = webpack(config)
  const server = new WebpackDevServer(config.devServer, compiler)
  const { port, host } = config.devServer
  server.start().then(() => {
    if (type(callback).isFunction) {
      return callback({ port, host })
    }
    const loopback = host === '0.0.0.0' ? 'localhost' : host
    logger('success', `Server Listen Loopback: http://${loopback}:${port} `, false)
    ipv4.forEach(ip => {
      if (ip != host) {
        logger('success', `Server Listen Network: http://${ip}:${port} `, false)
      }
    })
  })
}

/**
 * Run build production
 *
 * @param {Object} config  File source code
 * @param {Function} callback Options used
 *
 * @return {String}
 */
export function build(config = {}, callback) {
  if (!config.mode) {
    config.mode = 'production'
  }
  config = new DefineConfig(config)
  if (!type(callback).isFunction) {
    callback = (err, state) => {
      if (err) {
        logger('error', 'Build Error')
        logger(err.stack || err)
        // err.details && logger('error', ` ${err.details}`, false)
        return
      } else if (state.hasErrors()) {
        err = ''
        state.toString({
          chunks: false,
          colors: true
        }).split(/\r?\n/).forEach(line => {
          err += `    ${line}\n`
        })
        console.warn(err)
      } else {
        // console.log(state.toString({chunks: false,colors: true}))
        logger('success', ` Packed to ${config.output.path}`, false)
      }
    }
  }
  webpack(config, callback)
}
