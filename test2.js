const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire');

// Mocking dependencies
const mockRetrieveDecryptedCiphertextMapRequest = sinon.stub();
const mockGetInvolvedParty = sinon.stub();
const mockDecryptedCiphertextAPI = sinon.stub();
const mockGetCorrelationId = sinon.stub().returns('mock-correlation-id');
const mockLogError = sinon.stub();
const mockInfoV2 = sinon.stub();
const mockCertificateManager = sinon.stub();
const mockSmParameters = sinon.stub();
const mockFetchCertValuesFromSM = sinon.stub();

// Replace the dependencies using proxyquire
const getEtchData = proxyquire('../path/to/getEtchData', {
  '@bmo-util/framework': {
    infoV2: mockInfoV2,
    getCorrelationId: mockGetCorrelationId,
    logError: mockLogError,
  },
  '../subService/ALE/mapRequest': { retrieveDecryptedCiphertextMapRequest: mockRetrieveDecryptedCiphertextMapRequest },
  '../subService/getInvolvedParty/index.js': { getInvolvedParty: mockGetInvolvedParty },
  '../subService/ALE/index.js': { decryptedCiphertextAPI: mockDecryptedCiphertextAPI },
  '../../../utilities/topLevelAwait/certificateManager.js': { certificateManager: mockCertificateManager },
  '../../../utilities/topLevelAwait/fetchApiParameters': { smParameters: mockSmParameters },
  '../../../utilities/topLevelAwait/fetchCert.js': { fetchCertValuesFromSM: mockFetchCertValuesFromSM },
});

describe('getEtchData', () => {
  let args;
  let payload;

  beforeEach(() => {
    // Initialize the arguments and payload for testing
    args = {
      decryptKeySSMPath: 'test-key',
      decryptHostsSMPath: 'test-host',
      sm: 'test-sm',
      headers: { 'x-fapi-interaction-id': 'test-fapi-id' },
    };
    payload = { key: 'value' };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return a successful response with decrypted data when statusCode is 200', async () => {
    // Mocking the responses for each of the dependencies
    mockRetrieveDecryptedCiphertextMapRequest.resolves({
      isCryptoKey: true,
      data: {
        appCatId: 'testAppCatId',
        CyptoKey: 'testCryptoKey',
        decryptLambdaUri: 'testUri',
        DecryptedCiphertextpayload: 'testPayload',
        retrieveDecryptedCiphertextLambdaName: 'testLambdaName',
      },
    });

    mockGetInvolvedParty.resolves({ statusCode: 200, body: { data: 'mockBody' } });
    mockDecryptedCiphertextAPI.resolves({ data: 'finalMockBody' });
    mockCertificateManager.prototype.prepareCertObject = sinon.stub().resolves();

    const result = await getEtchData(payload, args);

    // Ensure that the correct calls were made
    expect(mockRetrieveDecryptedCiphertextMapRequest.calledOnce).to.be.true;
    expect(mockGetInvolvedParty.calledOnce).to.be.true;
    expect(mockDecryptedCiphertextAPI.calledOnce).to.be.true;

    // Assert the response structure
    expect(result).to.have.property('statusCode', 200);
    expect(result.body).to.include('finalMockBody');
  });

  it('should return a 400 response and log error when an exception occurs', async () => {
    const error = new Error('Test Error');
    mockRetrieveDecryptedCiphertextMapRequest.rejects(error);

    const result = await getEtchData(payload, args);

    // Ensure the error is logged
    expect(mockLogError.calledOnce).to.be.true;
    expect(result).to.have.property('statusCode', '400');
    expect(result.body).to.include('Test Error');
  });

  it('should handle missing headers and return default interaction ID', async () => {
    const argsWithoutHeaders = { ...args, headers: undefined };

    mockRetrieveDecryptedCiphertextMapRequest.resolves({
      isCryptoKey: true,
      data: {
        appCatId: 'testAppCatId',
        CyptoKey: 'testCryptoKey',
        decryptLambdaUri: 'testUri',
        DecryptedCiphertextpayload: 'testPayload',
        retrieveDecryptedCiphertextLambdaName: 'testLambdaName',
      },
    });

    mockGetInvolvedParty.resolves({ statusCode: 200, body: { data: 'mockBody' } });
    mockDecryptedCiphertextAPI.resolves({ data: 'finalMockBody' });
    mockCertificateManager.prototype.prepareCertObject = sinon.stub().resolves();

    const result = await getEtchData(payload, argsWithoutHeaders);

    // Check the default "x-fapi-interaction-id" value
    expect(result.headers['x-fapi-interaction-id']).to.equal('987654321');
  });

it('should return body directly when is_ALE is false or statusCode is not 200', async () => {
  // Simulate a scenario where is_ALE is false
  mockRetrieveDecryptedCiphertextMapRequest.resolves({
    isCryptoKey: false, // is_ALE is false
    data: {
      appCatId: 'testAppCatId',
      CyptoKey: 'testCryptoKey',
      decryptLambdaUri: 'testUri',
      DecryptedCiphertextpayload: 'testPayload',
      retrieveDecryptedCiphertextLambdaName: 'testLambdaName',
    },
  });

  mockGetInvolvedParty.resolves({ statusCode: 400, body: { data: 'mockBody' } }); // statusCode is not 200

  const result = await getEtchData(payload, args);

  // Ensure that the else block is hit and finalResponseBody is set to body directly
  expect(mockRetrieveDecryptedCiphertextMapRequest.calledOnce).to.be.true;
  expect(mockGetInvolvedParty.calledOnce).to.be.true;
  expect(result).to.have.property('statusCode', 400); // We expect the statusCode to be the one from getInvolvedParty
  expect(result.body).to.include('mockBody'); // We expect the body to be returned as is, not processed by decryptedCiphertextAPI
});

it('should handle an error and cover the catch block', async () => {
  // Simulate an error in one of the async functions
  const error = new Error('Test Error');
  mockRetrieveDecryptedCiphertextMapRequest.rejects(error); // This will trigger the catch block

  // Run the function with arguments
  const result = await getEtchData(payload, args);

  // Verify the catch block was hit
  expect(mockLogError.calledOnce).to.be.true;
  expect(result).to.have.property('statusCode', '400');
  expect(result.headers['x-fapi-interaction-id']).to.equal('test-fapi-id'); // Verifying the headers
  
  // Check if the default value "987654321" is used when headers are missing
  const argsWithoutHeaders = { ...args, headers: undefined };
  const resultWithoutHeaders = await getEtchData(payload, argsWithoutHeaders);
  
  expect(resultWithoutHeaders.headers['x-fapi-interaction-id']).to.equal('987654321'); // Default value
});

  
});
