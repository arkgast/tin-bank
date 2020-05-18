const {
  URL,
  BANK_SIGNER,
  BANK_PUBLIC_KEY,
  BANK_SECRET_KEY,
  ACH_SIGNER
} = process.env

module.exports = {
  port: 3000,
  projectUrl: URL,
  bank: {
    signerAddress: BANK_SIGNER,
    publicKey: BANK_PUBLIC_KEY,
    secretKey: BANK_SECRET_KEY
  },
  ach: {
    signerAddress: ACH_SIGNER
  }
}
