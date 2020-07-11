const express = require('express')
const config = require('config')
const debug = require('debug')('tin-bank:debit')
const tinapi = require('tinapi_')

const router = express.Router()

const ASYNC = true
const DELAY = 500

const getUploadAction = action => {
  const createActionRequest = new tinapi.CreateActionRequest()
  createActionRequest.source = config.get('bank.signerAddress')
  createActionRequest.target = action.snapshot.source.signer.handle
  createActionRequest.amount = action.amount
  createActionRequest.symbol = action.symbol
  createActionRequest.labels = {
    tx_ref: action.labels.tx_ref,
    type: 'UPLOAD'
  }

  return createActionRequest
}

const createAction = async action => {
  const api = new tinapi.ActionApi()
  const actionUpload = getUploadAction(action)
  const actionCreated = await api.createAction(actionUpload)
  return actionCreated
}

const callContinue = (uploadAction, mainActionId) => {
  const timer = setTimeout(async () => {
    debug('CALL CONTINUE ENDPOINT')
    const actionApi = new tinapi.ActionApi()
    const uploadSigned = await actionApi.signAction(uploadAction.action_id)

    const transferApi = new tinapi.TransferApi()
    const actionContinue = await transferApi.continueP2Ptranfer(mainActionId, {
      actionSigned: uploadSigned
    })

    debug('CONTINUE ENDPOINT RESPONSE %O', actionContinue)
    clearTimeout(timer)
  }, DELAY)
}

const signAction = async (uploadAction, mainActionId) => {
  const api = new tinapi.ActionApi()

  if (ASYNC) {
    callContinue(uploadAction, mainActionId)
    return uploadAction
  }

  const actionSigned = await api.signAction(uploadAction.action_id)
  return actionSigned
}

router.post('/', async (req, res) => {
  const action = req.body
  const mainActionId = action.action_id
  debug('MAIN ACTION %O', action)

  const actionUpload = await createAction(action)
  debug('UPLOAD CREATED %O', actionUpload)

  const actionSigned = await signAction(actionUpload, mainActionId)
  debug('UPLOAD SIGNED %O', actionSigned)

  res.send(actionSigned)
})

module.exports = router
