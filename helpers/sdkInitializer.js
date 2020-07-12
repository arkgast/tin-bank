const config = require('config')
const Tinapi = require('tinapi_')
const debug = require('debug')('tin-bank:helpers:tin')

const { CLIENT_ID, CLIENT_SECRET, API_KEY } = process.env

function initializeSdk () {
  const { instance } = Tinapi.ApiClient
  instance.basePath = config.get('projectUrl')

  const { ApiKeyAuth, oAuth2ClientCredentials } = instance.authentications
  ApiKeyAuth.apiKey = API_KEY

  oAuth2ClientCredentials.clientId = CLIENT_ID
  oAuth2ClientCredentials.clientSecret = CLIENT_SECRET
  debug('SDK Initialized')
}

module.exports = initializeSdk
