const express = require('express')
const debug = require('debug')('tin-bank:credit')
const { createAction, signAction } = require('../helpers/api')

const router = express.Router()

router.post('/', async (req, res) => {
  const mainAction = req.body
  const mainActionId = mainAction.action_id
  debug('MAIN ACTION %O', mainAction)

  const actionDownload = await createAction(mainAction, 'DOWNLOAD')
  debug('DOWNLOAD CREATED %O', actionDownload)

  const actionSigned = await signAction(actionDownload, mainActionId)
  debug('DOWNLOAD SIGNED %O', actionSigned)

  res.send(actionSigned)
})

module.exports = router
