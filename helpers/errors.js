class BaseError extends Error {
  constructor (message, code) {
    super(message)
    this.code = code
    this.message = message
  }

  toPlainObject () {
    return {
      code: this.code,
      message: this.message
    }
  }
}

class BankError extends BaseError {
  constructor (message) {
    super(message, 314)
  }
}

module.exports = {
  BankError
}
