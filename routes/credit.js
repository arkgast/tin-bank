const express = require('express')
const debug = require('debug')('tin-bank:credit')
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
  setupConfig(mainAction, 'DOWNLOAD')
  debug('MAIN ACTION %O', mainAction)

  let actionDownload

  try {
    const mainActionId = mainAction.action_id

    actionDownload = await createAction(mainAction, 'DOWNLOAD')
    debug('DOWNLOAD CREATED %O', actionDownload)

    const mainActionStatus = mainAction.labels.status
    const actionSigned = await signAction(actionDownload, mainActionStatus)
    debug('DOWNLOAD SIGNED %O', actionSigned)

    const isAsyncFlow = mainAction.labels.config.download.asyncFlow
    if (isAsyncFlow) {
      callContinueEndpoint(actionSigned, mainActionId)
      return res.send(actionDownload)
    }

    res.send(actionSigned)
  } catch (error) {
    const errorSanitized = sanitizeError(actionDownload, error)
    if (_.isNumber(errorSanitized)) {
      return res.sendStatus(errorSanitized)
    }
    const actionError = setActionError(actionDownload, errorSanitized)
    debug('ACTION ERROR %O', actionError)
    res.status(400).send(actionError)
  }
})

module.exports = router
