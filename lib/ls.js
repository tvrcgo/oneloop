const fs = require('fs')
const { resolve } = require('path')

function exist(path) {
  try {
    const stat = fs.lstatSync(path)
    return true
  } catch (err) {
    return false
  }
}

const ls = (path) => {
  if (!exist(path)) {
    return []
  }
  const files = fs.readdirSync(path)
    .map(f => {
      const fpath = resolve(path, f)
      if (fs.lstatSync(fpath).isDirectory()) {
        return ls(fpath)
      }
      return fpath
    })
    .reduce((a, b) => [].concat(a, b), [])
  return [].concat(files)
}

module.exports = ls
