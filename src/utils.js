import path from 'path'
import fs from 'fs'
import { tmpdir, networkInterfaces } from 'os'
import { createHash } from 'crypto'
import picocolors from 'picocolors'
import { merge } from 'webpack-merge'
import { version } from '../package.json'

const cwd = process.cwd()
const lib = path.resolve(__dirname, '..')
const isTermColor = process.platform !== 'win32' || process.env.CI || process.env.TERM === 'xterm-256color'
const ipv4 = getNetworkIp()
const cacheDir = getCacheDir()
const libModules = getLibModulesDir()
export { cwd, lib, libModules, merge, version, ipv4, cacheDir }

function getLibModulesDir() {
  let dir
  const npmMod = path.resolve(lib, 'node_modules/webpack')
  const pnpmMod = path.resolve(lib, '../webpack')
  if (fs.existsSync(npmMod)) {
    dir = path.resolve(lib, 'node_modules')
  } else if (fs.existsSync(pnpmMod)) {
    dir = path.resolve(lib, '../')
  } else{
    logger('error', `Webun Error: The webun is damaged, please install it`)
    process.exit(1)
  }
  return dir
}

function getCacheDir() {
  // const cacheDirectory = path.resolve(cwd,'node_modules')
  const cacheDirectory = tmpdir()
  const md5 = createHash('md5')
  const id = md5.update(cwd).digest('hex')
  return path.resolve(cacheDirectory, '.webun', id)
}

function getNetworkIp() {
  let ipv4 = []
  const network = networkInterfaces()
  Object.entries(network).forEach(([key, val]) => {
    val.forEach(({ family, internal, address }) => {
      family === 'IPv4' && !internal && ipv4.push(address)
    })
  })
  return ipv4
}

export function type(obj) {
  const ret = {}
  const type = Object.prototype.toString.call(obj).replace(/\[object\s|\]/g, '')
  ret[`is${type}`] = true
  return ret
}

export function logger(type = 'info', msg = '', icon = true) {
  if (!type) return
  const maps = {
    info: ['cyan', 'ℹ', ' i'],
    success: ['green', '✔', '√'],
    warning: ['yellow', '⚠', '‼'],
    error: ['red', '✖', '×']
  }
  const map = maps[type]
  if (map && msg) {
    if (icon) {
      icon = map[isTermColor ? 1 : 2]
      msg = `${icon} ${msg}`
    }
    const color = picocolors[map[0]]
    msg = color ? color(msg) : msg
  } else {
    msg = type
  }
  msg && console.log(msg)
}

export function mergeConfig(defaultConfig = {}, usrConfig) {
  const disabledName = '__disabled__'
  if (type(usrConfig).isObject) {
    for (let key in usrConfig) {
      const uv = usrConfig[key]
      const dv = defaultConfig[key]
      const uvIsObj = type(uv).isObject
      const dvIsObj = type(dv).isObject
      if (uvIsObj) {
        if (dvIsObj) {
          defaultConfig[key] = mergeConfig(dv, uv)
          delete defaultConfig[key][disabledName]
        } else {
          defaultConfig[key] = uv
        }
      } else {
        if (uv === true) {
          dvIsObj && delete defaultConfig[key][disabledName]
        } else {
          defaultConfig[key] = uv
        }
      }
    }
  }
  for (let key in defaultConfig) {
    let dv = defaultConfig[key]
    if (type(dv).isObject) {
      if (dv[disabledName]) {
        defaultConfig[key] = false
      } else {
        defaultConfig[key] = mergeConfig(dv)
        delete defaultConfig[key][disabledName]
      }
    }
  }
  return defaultConfig
}