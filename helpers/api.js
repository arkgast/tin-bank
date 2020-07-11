const config = require('config')
const debug = require('debug')('tin-bank:helpers/api')
const tinapi = require('tinapi_')

const DELAY = 0
const ASYNC = true

const buildUploadAction = action => {
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

const buildDownloadAction = action => {
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

const buildAction = (action, type) => {
  switch (type) {
    case 'UPLOAD':
      return buildUploadAction(action)
    case 'DOWNLOAD':
      return buildDownloadAction(action)
  }
}

const createAction = async (action, type) => {
  const api = new tinapi.ActionApi()
  const actionUpload = buildAction(action, type)
  const actionCreated = await api.createAction(actionUpload)
  return actionCreated
}

const callContinue = (action, mainActionId) => {
  const timer = setTimeout(async () => {
    debug('CALL CONTINUE ENDPOINT')
    const actionApi = new tinapi.ActionApi()
    const uploadSigned = await actionApi.signAction(action.action_id)

    const transferApi = new tinapi.TransferApi()
    const actionContinue = await transferApi.continueP2Ptranfer(mainActionId, {
      actionSigned: uploadSigned
    })

    debug('CONTINUE ENDPOINT RESPONSE %O', actionContinue)
    clearTimeout(timer)
  }, DELAY)
}

const signAction = async (action, mainActionId) => {
  const api = new tinapi.ActionApi()

  if (ASYNC) {
    callContinue(action, mainActionId)
    return action
  }

  const actionSigned = await api.signAction(action.action_id)
  return actionSigned
}

module.exports = {
  createAction,
  signAction
}
