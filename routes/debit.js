const express = require('express')
const config = require('config')
const debug = require('debug')('tin-bank:debit')
const tinapi = require('tinapi_')
const sdk = require('@webwallet/sdk')

const { KEEPER_PUBLIC, KEEPER_SECRET } = process.env
const router = express.Router()

const ASYNC = false

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

const DELAY = 2000
const callContinueWithDelay = (action, actionCreated, iou) => {
  const timer = setTimeout(async () => {
    debug('CALL CONTINUE')
    const api = new tinapi.ActionApi()
    const actionSigned = await api.signOffline(actionCreated.action_id, iou)

    const transfer = new tinapi.TransferApi()
    const actionContinue = await transfer.continueP2Ptranfer(action.action_id, {
      actionSigned
    })

    debug('CONTINUE RESPONSE %O', actionContinue)
    clearTimeout(timer)
  }, DELAY)
}

const createAndSignAction = async action => {
  const api = new tinapi.ActionApi()

  const actionUpload = getActionUpload(action)
  const actionCreated = await api.createAction(actionUpload)
  const iou = createIOU(actionCreated)

  if (ASYNC) {
    callContinueWithDelay(action, actionCreated, iou)
    return actionCreated
  }

  const actionSigned = await api.signOffline(actionCreated.action_id, iou)

  return actionSigned
}

router.post('/', async (req, res) => {
  const action = req.body
  debug(JSON.stringify(action, null, 2))

  const actionSigned = await createAndSignAction(action)
  debug('ACTION UPLOAD SIGNED %O', actionSigned)

  res.send(actionSigned)
})

module.exports = router
