const express = require('express')
const config = require('config')
const debug = require('debug')('tin-bank:credit')
const tinapi = require('tinapi_')

const router = express.Router()

const ASYNC = false

const getActionDownload = action => {
  const createActionRequest = new tinapi.CreateActionRequest()
  createActionRequest.amount = action.amount
  createActionRequest.symbol = action.symbol
  createActionRequest.labels = {
    tx_ref: action.labels.tx_ref,
    type: 'DOWNLOAD'
  }
  createActionRequest.target = config.get('bank.signerAddress')

  const { status } = action.labels
  if (status === 'REJECTED' || status === 'ERROR') {
    createActionRequest.source = action.snapshot.source.signer.handle
  } else {
    createActionRequest.source = action.snapshot.target.signer.handle
  }

  return createActionRequest
}

const DELAY = 1000
const callContinue = action => {
  const timer = setTimeout(async () => {
    debug('CALL CONTINUE')
    const api = new tinapi.ActionApi()
    const actionSigned = await api.signAction(action.action_id)

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
  const actionDownload = getActionDownload(action)
  const actionCreated = await api.createAction(actionDownload)
  return actionCreated
}

const signAction = async action => {
  const api = new tinapi.ActionApi()

  if (ASYNC) {
    callContinue(action)
    return action
  }

  const actionSigned = await api.signAction(action.action_id)
  return actionSigned
}

router.post('/', async (req, res) => {
  const action = req.body
  debug(JSON.stringify(action, null, 2))

  const actionCreated = await createAction(action)
  const actionSigned = await signAction(actionCreated)
  debug('ACTION SIGNED %O', actionSigned)

  res.send(actionSigned)
})

module.exports = router
