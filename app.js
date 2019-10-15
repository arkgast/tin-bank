const express = require('express')
const bodyParser = require('body-parser')

require('@helpers/tin')

const action = require('./routes/action')
const credit = require('./routes/credit')
const debit = require('./routes/debit')
const status = require('./routes/status')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/v1/action', action)
app.use('/v1/credit', credit)
app.use('/v1/debit', debit)
app.use('/v1/status', status)

module.exports = app
