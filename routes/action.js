const express = require('express')
const debug = require('debug')('tin-bank:action')
const { setupConfig, signAction } = require('../helpers/api')

const router = express.Router()

router.post('/', async (req, res) => {
  const action = req.body
  debug('ACTION %O', action)
  setupConfig(action, action.labels.type)

  try {
    const actionSigned = await signAction(action)
    debug('ACTION SIGNED %O', actionSigned)

    res.send(actionSigned)
  } catch (error) {
    console.error(error.message)
    res.sendStatus(500)
  }
})

module.exports = router
