const express = require('express')
const config = require('config')
const debug = require('debug')('tin-bank:debit')
const tinapi = require('tinapi_')
const sdk = require('@webwallet/sdk')

const { KEEPER_PUBLIC, KEEPER_SECRET } = process.env
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

const getClaims = action => {
  const date = new Date()
  return {
    amount: action.amount,
    domain: 'achtin.minka.io',
    expiry: date.toISOString(),
    source: config.get('bank.signerAddress'),
    symbol: config.get('ach.signerAddress'),
    target: action.snapshot.target.signer.handle
  }
}

const getSigners = () => {
  return [
    {
      secret: KEEPER_SECRET,
      public: KEEPER_PUBLIC,
      scheme: 'ecdsa-ed25519',
      signer: config.get('bank.signerAddress')
    }
  ]
}

const createIOU = action => {
  const claims = getClaims(action)
  const signers = getSigners()
  return sdk.iou.write(claims).sign(signers)
}

const createAndSignAction = async action => {
  const api = new tinapi.ActionApi()

  const actionUpload = getActionUpload(action)
  const actionCreated = await api.createAction(actionUpload)

  const iou = createIOU(actionCreated)
  const actionSigned = await api.signOffline(actionCreated.action_id, iou)
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
