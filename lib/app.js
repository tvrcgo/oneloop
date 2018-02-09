const { resolve, dirname } = require('path')
const extend = require('extend2')
const ls = require('./ls')
const ora = require('ora')

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

  loadService(root = this.$root) {
    const services = ls(resolve(root, 'service'))
    services && services.map(name => {
      const key = name.replace(/\.js$/i, '')
      const Serv = require(resolve(root, 'service', key))
      this.service[key] = new Serv
    })
  }

  loadProgram(root = this.$root) {
    const programs = ls(resolve(root, 'program'))
    return programs.map(name => require(resolve(root, 'program', name)))
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
    const programs = this.loadProgram()
    spin.start()
    for (const pg of programs){
      try {
        await this.run(pg)
      } catch (err) {
        console.error('[start]', err)
        spin.stop()
      }
    }
  }

}

// Avoid prototype members being modified by plugin.
(Object.freeze || Object)(Application.prototype)

module.exports = Application
