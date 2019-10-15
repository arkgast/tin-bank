const express = require('express')
const debug = require('debug')('tin-bank:action')
const tinapi = require('tinapi_')

const router = express.Router()

router.post('/', async (req, res) => {
  const action = req.body
  debug(action)

  const api = new tinapi.ActionApi()
  const actionSigned = await api.signAction(action.action_id)

  res.json(actionSigned)
})

module.exports = router
