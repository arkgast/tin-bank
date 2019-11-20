const express = require('express')
const config = require('config')
const debug = require('debug')('tin-bank:credit')
const tinapi = require('tinapi_')

const router = express.Router()

const getActionDownload = action => {
  const createActionRequest = new tinapi.CreateActionRequest()
  createActionRequest.amount = action.amount
  createActionRequest.symbol = action.symbol
  createActionRequest.labels = {
    tx_ref: action.labels.tx_ref,
    type: 'DOWNLOAD'
  }

  if (action.labels.status === 'REJECTED') {
    createActionRequest.source = action.snapshot.source.signer.handle
    createActionRequest.target = config.get('bank.signerAddress')
  } else {
    createActionRequest.source = action.snapshot.target.signer.handle
    createActionRequest.target = config.get('bank.signerAddress')
  }

  return createActionRequest
}

const createAndSignAction = async action => {
  const api = new tinapi.ActionApi()

  const actionDownload = getActionDownload(action)
  const actionCreated = await api.createAction(actionDownload)
  const actionSigned = await api.signAction(actionCreated.action_id)

  return actionSigned
}

router.post('/', async (req, res) => {
  const action = req.body
  debug(JSON.stringify(action, null, 2))
  const actionSigned = await createAndSignAction(action)

  res.send(actionSigned)
})

module.exports = router
