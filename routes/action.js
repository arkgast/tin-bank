const express = require('express')
const debug = require('debug')('tin-bank:action')
const tinapi = require('tinapi_')

const router = express.Router()

router.post('/', async (req, res) => {
  const action = req.body
  debug('ACTION %O', action)

  const api = new tinapi.ActionApi()
  const actionSigned = await api.signAction(action.action_id)
  debug('ACTION SIGNED %O', actionSigned)

  res.json(actionSigned)
})

module.exports = router
