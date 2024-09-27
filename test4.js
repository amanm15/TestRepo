const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;
chai.use(require('chai-as-promised'));

const { encryptLambdaFinalResponse, validateDecryptedCiphertextResponse } = require('../service/subService/ALE/encryption');
const sandbox = sinon.createSandbox();

describe('Testing encryption.js', function () {
  const validDecryptedCiphertextResponse = {
    result: { code: '200' },
    contentEncryptionKey: 'RVJCYXJGCkJJNW56UUNzSOVOSTJKUjBPS1RZNZRPWEc=',
  };

  const invalidDecryptedCiphertextResponse = {
    result: { code: '400' }, // Invalid code
    contentEncryptionKey: null,
  };

  const getEtchDataResponse = {
    statusCode: 200,
    body: { data: 'sample response body' },
  };

  afterEach(function () {
    sandbox.restore();
  });

  it('should return valid encrypted response', async function () {
    const validXCryptoKey = 'header.part.part.validBase64Iv==';

    const result = await encryptLambdaFinalResponse(
      'request-id',
      'interaction-id',
      validXCryptoKey,
      validDecryptedCiphertextResponse,
      getEtchDataResponse
    );

    expect(result).to.be.an('object');
    expect(result.secure).to.have.property('encrypted', 'true');
  });

  it('should throw error for invalid x-cypto-key', async function () {
    const invalidXCryptoKey = 'invalid-key';

    await expect(
      encryptLambdaFinalResponse(
        'request-id',
        'interaction-id',
        invalidXCryptoKey,
        validDecryptedCiphertextResponse,
        getEtchDataResponse
      )
    ).to.be.rejectedWith('x-cypto-key is invalid');
  });

  it('should throw error for non-success decryptedCiphertextResponse', async function () {
    const validXCryptoKey = 'header.part.part.validBase64Iv==';

    await expect(
      encryptLambdaFinalResponse(
        'request-id',
        'interaction-id',
        validXCryptoKey,
        invalidDecryptedCiphertextResponse, // Invalid decrypted response
        getEtchDataResponse
      )
    ).to.be.rejectedWith('decryptedCiphertextResponse was not success');
  });

  it('should throw error for invalid contentEncryptionKey', async function () {
    const invalidDecryptedCiphertextResponse = {
      result: { code: '200' },
      contentEncryptionKey: '', // Empty or invalid contentEncryptionKey
    };

    const validXCryptoKey = 'header.part.part.validBase64Iv==';

    await expect(
      encryptLambdaFinalResponse(
        'request-id',
        'interaction-id',
        validXCryptoKey,
        invalidDecryptedCiphertextResponse,
        getEtchDataResponse
      )
    ).to.be.rejectedWith('contentEncryptionkey value is invalid');
  });
});
