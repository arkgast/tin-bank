const express = require('express')
const debug = require('debug')('tin-bank:status')

const router = express.Router()

router.post('/', (req, res) => {
  const action = req.body
  debug(action)
  res.send(action)
})

module.exports = router
