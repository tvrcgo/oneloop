const { resolve, dirname, basename } = require('path')
const extend = require('extend2')
const ora = require('ora')
const fg = require('fast-glob')

class Application {

  constructor() {
    Object.defineProperties(this, {
      $root: {
        value: resolve(dirname(process.mainModule.filename)),
        enumerable: false,
        writable: false
      },
      config: {
        value: {},
        enumerable: false,
        writable: true
      },
      service: {
        value: {},
        enumerable: false,
        writable: true
      }
    })
    // initialize
    this.loadConfig()
    this.loadService()
  }

  loadConfig() {
    const base = require(resolve(this.$root ,'config/config.default'))
    const postfix = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    const env = require(resolve(this.$root, `config/config.${postfix}`))
    this.config = extend(true, {}, base, env)
  }

  loadService() {
    const root = resolve(this.$root, 'service')
    const services = fg.sync([ resolve(root, '**/*.js') ])
    services && services.map(one => {
      const kpath = one
        .replace(root, '') // remove prefix
        .replace(/(^\/|\.js$)/g, '') // remove slash
        .split('/')
      let parent = this.service
      kpath.map((k, idx) => {
        if (idx < kpath.length - 1) {
          if (!parent[k]) {
            parent[k] = {}
          }
          parent = parent[k]
        }
      })
      const Serv = require(one)
      parent[kpath[kpath.length - 1]] = new Serv
    })
  }

  loadProgram() {
    const programs = fg.sync([ resolve(this.$root, 'program/**/*.js') ])
    return programs.map(pg => require(pg))
  }

  async run(program) {
    try {
      const ret = await program.call(this)
      ret && process.nextTick(async () => {
        await this.run(program)
      })
    } catch (err) {
      console.error('[run]', err)
    }
  }

  async start() {
    const spin = ora('running ...')
    spin.start()
    const programs = this.loadProgram()
    for (const pg of programs){
      try {
        await this.run(pg)
      } catch (err) {
        console.error('[start]', err)
      }
    }
  }

}

// Avoid prototype members being modified by plugin.
(Object.freeze || Object)(Application.prototype)

module.exports = Application
