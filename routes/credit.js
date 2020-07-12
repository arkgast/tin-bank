const express = require('express')
const debug = require('debug')('tin-bank:credit')
const { createAction, setupConfig, signAction } = require('../helpers/api')

const router = express.Router()

router.post('/', async (req, res) => {
  const mainAction = req.body
  setupConfig(mainAction, 'DOWNLOAD')
  debug('MAIN ACTION %O', mainAction)

  try {
    const mainActionId = mainAction.action_id

    const actionDownload = await createAction(mainAction, 'DOWNLOAD')
    debug('DOWNLOAD CREATED %O', actionDownload)

    const actionSigned = await signAction(actionDownload, mainActionId)
    debug('DOWNLOAD SIGNED %O', actionSigned)

    res.send(actionSigned)
  } catch (error) {
    console.error(error.message)
    res.sendStatus(500)
  }
})

module.exports = router
