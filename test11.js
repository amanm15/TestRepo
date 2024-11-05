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
    body: { data: "test data" },
  };

  afterEach(function () {
    sandbox.restore();
  });

  it('should return valid encrypted response', async function () {
    const validXCryptoKey = 'MDcwOThkYmEtZTQ0Yi00MzYwLTllYTItN2IzMmViZmRmMzBk.DIHi19Gsucl8Icdz78M+A/pSX/CYyb6ivfwvG5b6TRy+Lp5V6e4htq3K7tqCOP5RbBp6Mb6+uiiXV5b/KffCd6qYPe4uhqL6Zos0D4SWSmk03xYppXYsiDwvacXWSOQF++Z46t+9wNNVGe0x+dl0f/odIDIqklAk4uMBOcozP/zGaO16RShA3iaS7HBFBZWGWITgLfJNfUbDk6vj/KKLWEY0WQTeLjxkk0IFVBy0Oy0Uu3/d5SE0LIxzh2qXTFTYTwFXZN8EfYEeG3NHvM8njmXXVzTOvCNvDU4eyTMb1MRU2SYsCqFdHTCNkF89b7Wo4JWa5wJrA0FHemfPbENyfw==.gFFS0J2e+3dhd0xOkEoaY7n9atEYqcFJlsNim6YU0g8=.Q0pRS3lRdFJITk1jd05BRQ==';

    const result = await encryptLambdaFinalResponse(
      validXCryptoKey,
      validDecryptedCiphertextResponse,
      getEtchDataResponse
    );

    expect(result).to.be.an('object');
    expect(result.secure).to.have.property('encrypted', 'true');
  });

  it('should throw error for invalid x-cypto-key', async function () {
    const invalidXCryptoKey = 'invalidkey';

    await expect(
      encryptLambdaFinalResponse(
        invalidXCryptoKey,
        validDecryptedCiphertextResponse,
        getEtchDataResponse
      )
    ).to.be.rejectedWith('x-cypto-key is invalid');
  });

  it('should throw error for non-success decryptedCiphertextResponse', async function () {
    const validXCryptoKey = 'MDcwOThkYmEtZTQ0Yi00MzYwLTllYTItN2IzMmViZmRmMzBk.DIHi19Gsucl8Icdz78M+A/pSX/CYyb6ivfwvG5b6TRy+Lp5V6e4htq3K7tqCOP5RbBp6Mb6+uiiXV5b/KffCd6qYPe4uhqL6Zos0D4SWSmk03xYppXYsiDwvacXWSOQF++Z46t+9wNNVGe0x+dl0f/odIDIqklAk4uMBOcozP/zGaO16RShA3iaS7HBFBZWGWITgLfJNfUbDk6vj/KKLWEY0WQTeLjxkk0IFVBy0Oy0Uu3/d5SE0LIxzh2qXTFTYTwFXZN8EfYEeG3NHvM8njmXXVzTOvCNvDU4eyTMb1MRU2SYsCqFdHTCNkF89b7Wo4JWa5wJrA0FHemfPbENyfw==.gFFS0J2e+3dhd0xOkEoaY7n9atEYqcFJlsNim6YU0g8=.Q0pRS3lRdFJITk1jd05BRQ==';

    await expect(
      encryptLambdaFinalResponse(
        validXCryptoKey,
        invalidDecryptedCiphertextResponse,
        getEtchDataResponse
      )
    ).to.be.rejectedWith('decryptedCiphertextResponse was not success');
  });

  it('should throw error for invalid contentEncryptionKey', async function () {
    const invalidDecryptedCiphertextResponse = {
      result: { code: '200' },
      contentEncryptionKey: '', // Empty or invalid contentEncryptionKey
    };

    const validXCryptoKey = 'MDcwOThkYmEtZTQ0Yi00MzYwLTllYTItN2IzMmViZmRmMzBk.DIHi19Gsucl8Icdz78M+A/pSX/CYyb6ivfwvG5b6TRy+Lp5V6e4htq3K7tqCOP5RbBp6Mb6+uiiXV5b/KffCd6qYPe4uhqL6Zos0D4SWSmk03xYppXYsiDwvacXWSOQF++Z46t+9wNNVGe0x+dl0f/odIDIqklAk4uMBOcozP/zGaO16RShA3iaS7
