
module.exports = async function() {
  console.log('\r', this.config, new Date().toLocaleString())
  await this.service.util.sleep(2000)
  return true
}
