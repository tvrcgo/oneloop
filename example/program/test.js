
module.exports = async function(app) {
  await this.service.util.sleep(200)
  return true
}
