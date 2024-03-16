import fs from 'fs'
import path from 'path'
import sade from 'sade'
import { rimrafSync } from 'rimraf'
const { cwd, type, merge, logger, version, serve, build, cacheDir } = require('./index.js')

function run(opts = {}) {
  const { command, mode } = opts
  process.env.NODE_ACT = command
  process.env.NODE_ENV = mode
  let usrConfig = {}
  if (opts.config) {
    const configPath = path.resolve(cwd, opts.config)
    if (fs.existsSync(configPath)) {
      usrConfig = require(configPath)
    } else {
      logger('warning', `Config Warning: The config file '${configPath}' does not exist`)
    }
  } else {
    const configPath = path.resolve(cwd, 'webun.config.js')
    if (fs.existsSync(configPath)) {
      usrConfig = require(configPath)
    }
  }
  if (type(usrConfig).isFunction) {
    usrConfig = usrConfig(opts)
  }
  if (!type(usrConfig).isObject) {
    usrConfig = {}
    logger('warning', `Config Warning: The config must be of type Object`)
  }
  usrConfig = merge(usrConfig, opts)
  const commands = { serve, build }
  const _command = commands[command]
  _command && _command(usrConfig)
}

sade('webun')
  .option('--config, c', '[string] Use specified config file')
  .option('--mode, m', '[string] Set env mode (development | production)')
  .option('--force, f', '[boolean] Force the optimizer to ignore the cache')

  .command('serve', 'Start a $mode (default: development) server', { default: true })
  .option('--host, H', '[string] Specify hostname')
  .option('--port, p', '[number] Specify port')
  .action(({ force, config, mode, host, port }) => {
    const command = 'serve'
    if (mode != 'production') {
      mode = 'development'
    }
    const devServer = {}
    if (host) {
      devServer.host = host
    }
    if (port) {
      devServer.port = port
    }
    run({ config, command, mode, force, devServer })
  })

  .command('build', 'Build a $mode (default: production) product')
  .action(({ force, config, mode }) => {
    const command = 'build'
    if (mode != 'development') {
      mode = 'production'
    }
    run({ config, command, mode, force })
  })

  .command('clear', 'Clear all caches of the webun')
  .action(() => {
    if(fs.existsSync(cacheDir)){
      if(rimrafSync(cacheDir)){
        logger('success', `All cache files have been cleared`)
      }else{
        logger('error', 'Cache file clearing failed')
      }
    }else{
      logger('No cache file')
    }
  })

  .version(version)
  .parse(process.argv)
