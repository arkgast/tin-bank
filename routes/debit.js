const express = require('express')
const debug = require('debug')('tin-bank:debit')
const { createAction, signAction } = require('../helpers/api')

const router = express.Router()

router.post('/', async (req, res) => {
  const mainAction = req.body
  const mainActionId = mainAction.action_id
  debug('MAIN ACTION %O', mainAction)

  const actionUpload = await createAction(mainAction, 'UPLOAD')
  debug('UPLOAD CREATED %O', actionUpload)

  const actionSigned = await signAction(actionUpload, mainActionId)
  debug('UPLOAD SIGNED %O', actionSigned)

  res.send(actionSigned)
})

module.exports = router
