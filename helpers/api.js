const config = require('config')
const debug = require('debug')('tin-bank:helpers:api')
const tinapi = require('tinapi_')
const _ = require('lodash')
const { BankDefaultError } = require('./errors.js')

const DEFAULT_CONFIG = {
  createAction: true,
  signAction: true,
  continueCallDelay: 0,
  responseCallDelay: 0,
  asyncFlow: true,
  error: BankDefaultError
}

const sleep = async timeMs => {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      clearTimeout(timer)
    }, timeMs)
  })
}

const allowCreateAction = (action, actionType) => {
  const endpointConfig = action.labels.config[actionType.toLowerCase()]
  if (!endpointConfig.createAction) {
    throw new Error('Cannot create action')
  }
}

const allowSignAction = action => {
  const actionType = action.labels.type.toLowerCase()
  const endpointConfig = action.labels.config[actionType.toLowerCase()]
  if (!endpointConfig.signAction) {
    throw new Error('Cannot sign action')
  }
}

const setupConfig = (action, actionType) => {
  const configProperty = actionType.toLowerCase()
  let endpointConfig = _.get(action, ['labels', 'config', configProperty])
  const endpointConfigExists = !_.isNil(endpointConfig)

  endpointConfig = endpointConfigExists
    ? _.merge(DEFAULT_CONFIG, endpointConfig)
    : DEFAULT_CONFIG

  _.merge(action, { labels: { config: { [configProperty]: endpointConfig } } })
}

const buildUploadAction = mainAction => {
  const createActionRequest = new tinapi.CreateActionRequest()
  createActionRequest.source = config.get('bank.signerAddress')
  createActionRequest.target = mainAction.snapshot.source.signer.handle
  createActionRequest.amount = mainAction.amount
  createActionRequest.symbol = mainAction.symbol
  createActionRequest.labels = {
    tx_ref: mainAction.labels.tx_ref,
    type: 'UPLOAD'
  }

  return createActionRequest
}

const buildDownloadAction = mainAction => {
  const createActionRequest = new tinapi.CreateActionRequest()
  createActionRequest.amount = mainAction.amount
  createActionRequest.symbol = mainAction.symbol
  createActionRequest.labels = {
    tx_ref: mainAction.labels.tx_ref,
    type: 'DOWNLOAD'
  }
  createActionRequest.target = config.get('bank.signerAddress')

  if (mainAction.labels.status === 'REJECTED') {
    createActionRequest.source = mainAction.snapshot.source.signer.handle
  } else {
    createActionRequest.source = mainAction.snapshot.target.signer.handle
  }

  return createActionRequest
}

const buildAction = (mainAction, type) => {
  switch (type) {
    case 'UPLOAD':
      return buildUploadAction(mainAction)
    case 'DOWNLOAD':
      return buildDownloadAction(mainAction)
  }
}

const createAction = async (mainAction, type) => {
  allowCreateAction(mainAction, type)

  const api = new tinapi.ActionApi()
  const action = buildAction(mainAction, type)
  const actionCreated = await api.createAction(action)
  actionCreated.labels.config = mainAction.labels.config
  return actionCreated
}

const callContinueEndpoint = async (action, mainActionId) => {
  const actionType = action.labels.type.toLowerCase()
  const { continueCallDelay } = action.labels.config[actionType]
  await sleep(continueCallDelay)

  debug('CALL CONTINUE ENDPOINT')
  const transferApi = new tinapi.TransferApi()
  const actionContinue = await transferApi.continueP2Ptranfer(mainActionId, {
    actionSigned: action
  })
  debug('CONTINUE ENDPOINT RESPONSE %O', actionContinue)
}

const signAction = async (action, mainActionId) => {
  allowSignAction(action)
  const api = new tinapi.ActionApi()
  const actionSigned = await api.signAction(action.action_id)
  actionSigned.labels.config = action.labels.config
  return actionSigned
}

module.exports = {
  callContinueEndpoint,
  createAction,
  setupConfig,
  signAction
}
