const express = require('express')
const debug = require('debug')('tin-bank:debit')
const { createAction, signAction } = require('../helpers/api')

const router = express.Router()

router.post('/', async (req, res) => {
  const action = req.body
  const mainActionId = action.action_id
  debug('MAIN ACTION %O', action)

  const actionUpload = await createAction(action, 'UPLOAD')
  debug('UPLOAD CREATED %O', actionUpload)

  const actionSigned = await signAction(actionUpload, mainActionId)
  debug('UPLOAD SIGNED %O', actionSigned)

  res.send(actionSigned)
})

module.exports = router
