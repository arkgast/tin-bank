const express = require('express')
const bodyParser = require('body-parser')
const initializeSdk = require('@helpers/sdkInitializer')

const actionEndpoint = require('./routes/action')
const creditEndpoint = require('./routes/credit')
const debitEndpoint = require('./routes/debit')
const statusEndpoint = require('./routes/status')

initializeSdk()
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/action', actionEndpoint)
app.use('/credit', creditEndpoint)
app.use('/debit', debitEndpoint)
app.use('/status', statusEndpoint)

module.exports = app
