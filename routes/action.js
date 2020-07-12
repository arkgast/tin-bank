const express = require('express')
const debug = require('debug')('tin-bank:action')
const _ = require('lodash')

const {
  sanitizeError,
  setActionError,
  setupConfig,
  signAction,
  sleep
} = require('../helpers/api')

const router = express.Router()

router.post('/', async (req, res) => {
  const action = req.body
  debug('ACTION %O', action)
  setupConfig(action, action.labels.type)

  try {
    const actionSigned = await signAction(action)
    debug('ACTION SIGNED %O', actionSigned)

    const actionType = action.labels.type.toLowerCase()
    const { responseDelay } = action.labels.config[actionType]
    await sleep(responseDelay)

    res.send(actionSigned)
  } catch (error) {
    const errorSanitized = sanitizeError(action, error)
    if (_.isNumber(errorSanitized)) {
      return res.sendStatus(errorSanitized)
    }
    const actionError = setActionError(action, errorSanitized)
    debug('ACTION ERROR %O', actionError)
    res.status(400).send(actionError)
  }
})

module.exports = router
