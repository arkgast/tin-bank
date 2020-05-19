const express = require('express')
const config = require('config')
const debug = require('debug')('tin-bank:debit')
const tinapi = require('tinapi_')
const sdk = require('@webwallet/sdk')

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
      secret: config.get('bank.secretKey'),
      public: config.get('bank.publicKey'),
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

const DELAY = 1000
const callContinue = (action, iou) => {
  const timer = setTimeout(async () => {
    debug('CALL CONTINUE')
    const api = new tinapi.ActionApi()
    const actionSigned = await api.signOffline(action.action_id, iou)

    const transfer = new tinapi.TransferApi()
    const actionContinue = await transfer.continueP2Ptranfer(action.action_id, {
      actionSigned
    })

    debug('CONTINUE RESPONSE %O', actionContinue)
    clearTimeout(timer)
  }, DELAY)
}

const createAction = async action => {
  const api = new tinapi.ActionApi()
  const actionUpload = getActionUpload(action)
  const actionCreated = await api.createAction(actionUpload)
  return actionCreated
}

const signAction = async action => {
  const api = new tinapi.ActionApi()
  const iou = createIOU(action)

  if (ASYNC) {
    callContinue(action, iou)
    return action
  }

  const actionSigned = await api.signOffline(action.action_id, iou)
  return actionSigned
}

router.post('/', async (req, res) => {
  const action = req.body
  debug(JSON.stringify(action, null, 2))

  const actionCreated = await createAction(action)
  const actionSigned = await signAction(actionCreated)
  debug('ACTION UPLOAD SIGNED %O', actionSigned)

  res.send(actionSigned)
})

module.exports = router
