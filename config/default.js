const { URL, BANK_SIGNER_ADDRESS } = process.env

module.exports = {
  port: 3000,
  projectUrl: URL,
  bank: {
    signerAddress: BANK_SIGNER_ADDRESS
  }
}
