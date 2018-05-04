
module.exports = async ctx => {
  const { app, echo } = ctx
  echo(app.config)
  await app.service.util.sleep(2000)
  return true
}
