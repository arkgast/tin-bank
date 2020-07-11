const express = require('express')
const config = require('config')
const debug = require('debug')('tin-bank:credit')
const tinapi = require('tinapi_')

const router = express.Router()

const ASYNC = true
const DELAY = 500

const getDownloadAction = action => {
  const createActionRequest = new tinapi.CreateActionRequest()
  createActionRequest.amount = action.amount
  createActionRequest.symbol = action.symbol
  createActionRequest.labels = {
    tx_ref: action.labels.tx_ref,
    type: 'DOWNLOAD'
  }
  createActionRequest.target = config.get('bank.signerAddress')

  const { actionStatus } = action.labels
  if (actionStatus === 'REJECTED') {
    createActionRequest.source = action.snapshot.source.signer.handle
  } else {
    createActionRequest.source = action.snapshot.target.signer.handle
  }

  return createActionRequest
}

const createAction = async action => {
  const api = new tinapi.ActionApi()
  const actionDownload = getDownloadAction(action)
  const actionCreated = await api.createAction(actionDownload)
  return actionCreated
}

const callContinue = action => {
  const timer = setTimeout(async () => {
    debug('CALL CONTINUE ENDPOINT')
    const api = new tinapi.ActionApi()
    const actionSigned = await api.signAction(action.action_id)

    const transfer = new tinapi.TransferApi()
    const actionContinue = await transfer.continueP2Ptranfer(action.action_id, {
      actionSigned
    })

    debug('CONTINUE ENDPOINT RESPONSE %O', actionContinue)
    clearTimeout(timer)
  }, DELAY)
}

const signAction = async (downloadAction, mainActionId) => {
  const api = new tinapi.ActionApi()

  if (ASYNC) {
    callContinue(downloadAction)
    return downloadAction
  }

  const actionSigned = await api.signAction(downloadAction.action_id)
  return actionSigned
}

router.post('/', async (req, res) => {
  const action = req.body
  const mainActionId = action.action_id
  debug('MAIN ACTION %O', action)

  const actionDownload = await createAction(action)
  debug('DOWNLOAD CREATED %O', actionDownload)

  const actionSigned = await signAction(actionDownload, mainActionId)
  debug('DOWNLOAD SIGNED %O', actionSigned)

  res.send(actionSigned)
})

module.exports = router
