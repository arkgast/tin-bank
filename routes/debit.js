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
  debug('MAIN ACTION %O', mainAction)

  let actionUpload = null

  try {
    actionUpload = await createAction(mainAction, 'UPLOAD')
    debug('UPLOAD CREATED %O', actionUpload)

    const mainActionStatus = mainAction.labels.status
    const actionSigned = await signAction(actionUpload, mainActionStatus)
    debug('UPLOAD SIGNED %O', actionSigned)

    const isAsyncFlow = mainAction.labels.config.upload.asyncFlow
    if (isAsyncFlow) {
      callContinueEndpoint(actionSigned, mainAction.action_id)
      return res.send(actionUpload)
    }

    res.send(actionSigned)
  } catch (error) {
    const isAsyncFlow = mainAction.labels.config.upload.asyncFlow

    const errorSanitized = sanitizeError(actionUpload, error)
    if (_.isNumber(errorSanitized)) {
      return res.sendStatus(errorSanitized)
    }

    if (_.isNil(actionUpload)) {
      return res.status(400).send(errorSanitized)
    }

    const actionError = setActionError(actionUpload, errorSanitized)
    debug('ACTION ERROR %O', actionError)

    if (isAsyncFlow) {
      callContinueEndpoint(actionError, mainAction.action_id)
      return res.send(actionUpload)
    }

    res.status(400).send(actionError)
  }
})

module.exports = router
