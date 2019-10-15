const express = require('express')
const config = require('config')
const debug = require('debug')('tin-bank:debit')
const tinapi = require('tinapi_')

const router = express.Router()

const getActionUpload = action => {
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

const createAndSignAction = async action => {
  const api = new tinapi.ActionApi()

  const actionUpload = getActionUpload(action)
  const actionCreated = await api.createAction(actionUpload)
  const actionSigned = await api.signAction(actionCreated.action_id)
  debug(actionSigned)

  return actionSigned
}

router.post('/', async (req, res) => {
  const action = req.body
  debug(action)

  const actionSigned = await createAndSignAction(action)

  res.send(actionSigned)
})

module.exports = router
