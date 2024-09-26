const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { expect } = require('chai');

let encryptLambdaFinalResponse;
let validateDecryptedCiphertextResponseStub;
let cryptoStub;

describe('encryptLambdaFinalResponse', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Stub for the validateDecryptedCiphertextResponse function
    validateDecryptedCiphertextResponseStub = sandbox.stub();

    // Stub for the crypto module
    cryptoStub = {
      createCipheriv: sandbox.stub().returns({
        update: sandbox.stub().returns(Buffer.from('encryptedData')),
        final: sandbox.stub().returns(Buffer.from('finalizedData'))
      })
    };

    // Use proxyquire to stub the 'crypto' and 'validateDecryptedCiphertextResponse'
    const encryption = proxyquire('../service/subService/ALE/encryption', {
      'crypto': cryptoStub, 
      '../service/subService/ALE/encryption': {
        validateDecryptedCiphertextResponse: validateDecryptedCiphertextResponseStub
      }
    });

    encryptLambdaFinalResponse = encryption.encryptLambdaFinalResponse;
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return a properly encrypted response', async () => {
    // Mock input data
    const x_request_id = 'mock-request-id';
    const _fapi_interaction_id = 'mock-interaction-id';
    const xCyptoKey = 'mock-key.part1.part2.part3.part4';
    const decryptedCiphertextResponse = { result: { code: '200' }, contentEncryptionkey: 'mock-encryption-key' };
    const getEtchDataResponse = { data: 'mock-data' };

    // Stub the validate function to return the expected data
    validateDecryptedCiphertextResponseStub.resolves({ contentEncryptionkey: 'mock-encryption-key' });

    // Call the function under test
    const result = await encryptLambdaFinalResponse(x_request_id, _fapi_interaction_id, xCyptoKey, decryptedCiphertextResponse, getEtchDataResponse);

    // Assertions
    expect(validateDecryptedCiphertextResponseStub.calledOnceWith(decryptedCiphertextResponse)).to.be.true;
    expect(cryptoStub.createCipheriv.calledOnce).to.be.true;
    expect(result).to.deep.equal({
      secure: {
        encrypted: 'true',
        data: 'encryptedDatafinalizedData'
      }
    });
  });

  it('should throw an error when validateDecryptedCiphertextResponse fails', async () => {
    // Mock input data
    const x_request_id = 'mock-request-id';
    const _fapi_interaction_id = 'mock-interaction-id';
    const xCyptoKey = 'mock-key';
    const decryptedCiphertextResponse = { result: { code: '500' }, contentEncryptionkey: 'mock-encryption-key' };

    // Stub the validate function to throw an error
    validateDecryptedCiphertextResponseStub.rejects(new Error('Validation failed'));

    try {
      await encryptLambdaFinalResponse(x_request_id, _fapi_interaction_id, xCyptoKey, decryptedCiphertextResponse, {});
      throw new Error('Expected function to throw');
    } catch (err) {
      expect(err.message).to.equal('Validation failed');
    }
  });

  it('should throw an error when xCyptoKey is invalid', async () => {
    // Mock input data
    const x_request_id = 'mock-request-id';
    const _fapi_interaction_id = 'mock-interaction-id';
    const xCyptoKey = 'invalid-key';  // Simulate invalid key format
    const decryptedCiphertextResponse = { result: { code: '200' }, contentEncryptionkey: 'mock-encryption-key' };

    // Stub the validate function to return the expected data
    validateDecryptedCiphertextResponseStub.resolves({ contentEncryptionkey: 'mock-encryption-key' });

    try {
      await encryptLambdaFinalResponse(x_request_id, _fapi_interaction_id, xCyptoKey, decryptedCiphertextResponse, {});
      throw new Error('Expected function to throw');
    } catch (err) {
      expect(err.message).to.equal('Bad Request header');
    }
  });

  it('should throw an error during encryption process', async () => {
    // Mock input data
    const x_request_id = 'mock-request-id';
    const _fapi_interaction_id = 'mock-interaction-id';
    const xCyptoKey = 'mock-key.part1.part2.part3.part4';
    const decryptedCiphertextResponse = { result: { code: '200' }, contentEncryptionkey: 'mock-encryption-key' };

    // Stub the validate function to return the expected data
    validateDecryptedCiphertextResponseStub.resolves({ contentEncryptionkey: 'mock-encryption-key' });

    // Stub the crypto module to throw an error during encryption
    cryptoStub.createCipheriv.throws(new Error('Encryption failed'));

    try {
      await encryptLambdaFinalResponse(x_request_id, _fapi_interaction_id, xCyptoKey, decryptedCiphertextResponse, {});
      throw new Error('Expected function to throw');
    } catch (err) {
      expect(err.message).to.equal('Encryption failed');
    }
  });

  it('should throw an error if contentEncryptionkey is invalid', async () => {
    // Mock input data
    const x_request_id = 'mock-request-id';
    const _fapi_interaction_id = 'mock-interaction-id';
    const xCyptoKey = 'mock-key.part1.part2.part3.part4';
    const decryptedCiphertextResponse = { result: { code: '200' }, contentEncryptionkey: '' }; // Invalid contentEncryptionkey

    // Stub the validate function to return an invalid contentEncryptionkey
    validateDecryptedCiphertextResponseStub.resolves({ contentEncryptionkey: '' });

    try {
      await encryptLambdaFinalResponse(x_request_id, _fapi_interaction_id, xCyptoKey, decryptedCiphertextResponse, {});
      throw new Error('Expected function to throw');
    } catch (err) {
      expect(err.message).to.equal('contentEncryptionkey value is invalid');
    }
  });
});
