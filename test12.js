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
const mockEncryptLambdaFinalResponse = sinon.stub(); // Mock for encryptLambdaFinalResponse

// Replace the dependencies using proxyquire
const getEtchData = proxyquire('../service/starters/getEtchData', {
  '@bmo-util/framework': {
    infoV2: mockInfoV2,
    getCorrelationId: mockGetCorrelationId,
    logError: mockLogError,
  },
  '../subService/ALE/mapRequest': { retrieveDecryptedCiphertextMapRequest: mockRetrieveDecryptedCiphertextMapRequest },
  '../subService/getInvolvedParty/index.js': { getInvolvedParty: mockGetInvolvedParty },
  '../subService/ALE/index.js': { decryptedCiphertextAPI: mockDecryptedCiphertextAPI },
  '../../../utilities/topLevelAwait/fetchApiParameters': { smParameters: sinon.stub() },
  '../../../utilities/topLevelAwait/fetchCert.js': { fetchCertValuesFromSM: sinon.stub() },
  '../subService/ALE/encrytion.js': { encryptLambdaFinalResponse: mockEncryptLambdaFinalResponse }, // Added mock for encryptLambdaFinalResponse
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
    mockDecryptedCiphertextAPI.resolves({ statusCode: 200, body: { data: 'finalMockBody' } });
    mockEncryptLambdaFinalResponse.resolves({ encryptedData: 'mockEncryptedData' });

    const result = await getEtchData(payload, args);

    // Ensure that the correct calls were made
    expect(mockRetrieveDecryptedCiphertextMapRequest.calledOnce).to.be.true;
    expect(mockGetInvolvedParty.calledOnce).to.be.true;
    expect(mockDecryptedCiphertextAPI.calledOnce).to.be.true;
    expect(mockEncryptLambdaFinalResponse.calledOnce).to.be.true; // Ensure encryption function was called

    // Assert the response structure
    expect(result).to.have.property('statusCode', '200');
    expect(result.body).to.include('mockEncryptedData');
  });

  it('should log error and return response when errorLogs are provided', async () => {
    const errorLogs = [['Error Message', 'Some additional details']];
    args.errorLogs = errorLogs;

    const result = await getEtchData(payload, args);

    expect(mockLogError.calledOnce).to.be.true; // Check if the logError was called
    expect(result).to.have.property('statusCode', 500); // Expecting an error response
    expect(result.body).to.include('Error in getting the values from initial promises');
  });

  it('should return a 500 response and log error when an exception occurs', async () => {
    const error = new Error('Test Error');
    mockRetrieveDecryptedCiphertextMapRequest.rejects(error);

    const result = await getEtchData(payload, args);

    // Ensure the error is logged
    expect(mockLogError.calledOnce).to.be.true; // Log should be called
    expect(result).to.have.property('statusCode', '500');
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
    mockDecryptedCiphertextAPI.resolves({ statusCode: 200, body: { data: 'finalMockBody' } });
    mockEncryptLambdaFinalResponse.resolves({ encryptedData: 'mockEncryptedData' });

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

    mockGetInvolvedParty.resolves({ statusCode: 400, body: { data: 'mockBody' } });

    const result = await getEtchData(payload, args);

    // Ensure that the else block is hit and finalResponseBody is set to body directly
    expect(mockRetrieveDecryptedCiphertextMapRequest.calledOnce).to.be.false;
    expect(mockGetInvolvedParty.calledOnce).to.be.true; // Should call getInvolvedParty
    expect(result).to.have.property('statusCode', 400); // We expect the statusCode to be the one from getInvolvedParty
    expect(result.body).to.include('mockBody'); // We expect the body to be returned as is
  });

  it('should handle an error and cover the catch block', async () => {
    // Simulate an error in one of the async functions
    const error = new Error('Test Error');
    mockRetrieveDecryptedCiphertextMapRequest.rejects(error); // This will trigger the catch block

    // Run the function with arguments
    const result = await getEtchData(payload, args);

    // Verify the catch block was hit
    expect(mockLogError.calledOnce).to.be.true; // Check if the logError was called
    expect(result).to.have.property('statusCode', '500');
    expect(result.headers['x-fapi-interaction-id']).to.equal('test-fapi-id'); // Verifying the headers

    // Check if the default value "987654321" is used when headers are missing
    const argsWithoutHeaders = { ...args, headers: undefined };
    const resultWithoutHeaders = await getEtchData(payload, argsWithoutHeaders);

    expect(resultWithoutHeaders.headers['x-fapi-interaction-id']).to.equal('987654321'); // Default value
  });

  it('should return a 400 response when decryptLambdaUri is missing', async () => {
    mockRetrieveDecryptedCiphertextMapRequest.resolves({
      isCryptoKey: true,
      data: {
        appCatId: 'testAppCatId',
        CyptoKey: 'testCryptoKey',
        decryptLambdaUri: null, // Simulating missing value
        DecryptedCiphertextpayload: 'testPayload',
        retrieveDecryptedCiphertextLambdaName: 'testLambdaName',
      },
    });

    const result = await getEtchData(payload, args);

    expect(result).to.have.property('statusCode', '400'); // Expect a 400 response due to missing decryptLambdaUri
  });

  it('should handle OCIF API failure when is_ALE is true', async () => {
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
    mockDecryptedCiphertextAPI.resolves({ statusCode: 500, body: { error: 'OCIF API error' } });

    const result = await getEtchData(payload, args);

    expect(result).to.have.property('statusCode', '500'); // Expect 500 due to OCIF API failure
    // Check specific error message in body if needed
  });

});

