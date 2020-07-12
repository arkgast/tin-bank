const express = require('express')
const debug = require('debug')('tin-bank:credit')
const _ = require('lodash')

const {
  callContinueEndpoint,
  createAction,
  sanitizeError,
  setActionError,
  setupConfig,
  signAction,
  sleep
} = require('../helpers/api')

const router = express.Router()

router.post('/', async (req, res) => {
  const mainAction = req.body
  setupConfig(mainAction, 'DOWNLOAD')
  debug('MAIN ACTION %O', mainAction)

  let actionDownload = null

  try {
    actionDownload = await createAction(mainAction, 'DOWNLOAD')
    debug('DOWNLOAD CREATED %O', actionDownload)

    const mainActionStatus = mainAction.labels.status
    const actionSigned = await signAction(actionDownload, mainActionStatus)
    debug('DOWNLOAD SIGNED %O', actionSigned)

    const { asyncFlow, responseDelay } = mainAction.labels.config.download
    if (asyncFlow) {
      callContinueEndpoint(actionSigned, mainAction.action_id)
      return res.send(actionDownload)
    }

    await sleep(responseDelay)
    res.send(actionSigned)
  } catch (error) {
    const isAsyncFlow = mainAction.labels.config.download.asyncFlow

    const errorSanitized = sanitizeError(actionDownload, error)
    if (_.isNumber(errorSanitized)) {
      return res.sendStatus(errorSanitized)
    }

    if (_.isNil(actionDownload)) {
      return res.status(400).send(errorSanitized)
    }

    const actionError = setActionError(actionDownload, errorSanitized)
    debug('ACTION ERROR %O', actionError)

    if (isAsyncFlow) {
      callContinueEndpoint(actionError, mainAction.action_id)
      return res.send(actionDownload)
    }

    res.status(400).send(actionError)
  }
})

module.exports = router
