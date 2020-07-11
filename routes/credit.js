const express = require('express')
const debug = require('debug')('tin-bank:credit')
const { createAction, signAction } = require('../helpers/api')

const router = express.Router()

router.post('/', async (req, res) => {
  const action = req.body
  const mainActionId = action.action_id
  debug('MAIN ACTION %O', action)

  const actionDownload = await createAction(action, 'DOWNLOAD')
  debug('DOWNLOAD CREATED %O', actionDownload)

  const actionSigned = await signAction(actionDownload, mainActionId)
  debug('DOWNLOAD SIGNED %O', actionSigned)

  res.send(actionSigned)
})

module.exports = router
