const express = require('express')
const debug = require('debug')('tin-bank:debit')
const _ = require('lodash')

const {
  callContinueEndpoint,
  createAction,
  sanitizeError,
  setActionError,
  setupConfig,
  signAction
} = require('../helpers/api')

const router = express.Router()

router.post('/', async (req, res) => {
  const mainAction = req.body
  setupConfig(mainAction, 'UPLOAD')

  let actionUpload

  try {
    const mainActionId = mainAction.action_id
    debug('MAIN ACTION %O', mainAction)

    actionUpload = await createAction(mainAction, 'UPLOAD')
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
    const errorSanitized = sanitizeError(actionUpload, error)
    if (_.isNumber(errorSanitized)) {
      return res.sendStatus(errorSanitized)
    }
    const actionError = setActionError(actionUpload, errorSanitized)
    debug('ACTION ERROR %O', actionError)
    res.status(400).send(actionError)
  }
})

module.exports = router
