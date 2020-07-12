const express = require('express')
const debug = require('debug')('tin-bank:debit')
const {
  callContinueEndpoint,
  createAction,
  setupConfig,
  signAction
} = require('../helpers/api')

const router = express.Router()

router.post('/', async (req, res) => {
  const mainAction = req.body
  setupConfig(mainAction, 'UPLOAD')

  try {
    const mainActionId = mainAction.action_id
    debug('MAIN ACTION %O', mainAction)

    const actionUpload = await createAction(mainAction, 'UPLOAD')
    debug('UPLOAD CREATED %O', actionUpload)

    const actionSigned = await signAction(actionUpload, mainActionId)
    debug('UPLOAD SIGNED %O', actionSigned)

    const isAsyncFlow = mainAction.labels.config.upload.asyncFlow
    if (isAsyncFlow) {
      callContinueEndpoint(actionSigned, mainActionId)
      return res.send(actionUpload)
    }

    res.send(actionSigned)
  } catch (error) {
    console.error(error.message)
    res.sendStatus(500)
  }
})

module.exports = router
