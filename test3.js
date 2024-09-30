const { expect } = require('chai');
const sinon = require('sinon');
const { decryptedCiphertextAPI } = require('../ALE/index');
const awsApi = require('../../../../utilities/apiCall/awsApi');
const encryption = require('../service/subService/ALE/encryption'); // Adjust path if needed
const { infoV2, logError } = require('@bmo-util/framework');

describe('decryptedCiphertextAPI', () => {
  let mockLambdaArgs;
  let mockFunctionArgs;
  let mockAwsApiInstance;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Mocked lambdaArgs and functionArgs
    mockLambdaArgs = {
      authenticationResources: {
        fetchParamterFromCache: sandbox.stub()
      },
      ssm: 'mockSSM',
      decryptHostSSMPath: 'mockDecryptHostSSMPath',
      decryptKeySSMPath: 'mockDecryptKeySSMPath'
    };

    mockFunctionArgs = {
      body: 'mockBody',
      appCatId: 'mockAppCatId',
      xCyptoKey: 'mockCyptoKey',
      x_request_id: 'mockRequestId',
      decryptLambdaUri: 'mockDecryptLambdaUri',
      x_fapi_interaction_id: 'mockInteractionId',
      DecryptedCiphertextpayload: 'mockDecryptedPayload',
      retrieveDecryptedCiphertextLambdaName: 'mockLambdaName'
    };

    // Mock awsApi instance and method
    mockAwsApiInstance = {
      doHttpOperation: sandbox.stub()
    };

    // Stubbing external dependencies
    sandbox.stub(awsApi.prototype, 'doHttpOperation').resolves('mockAPIResponse');
    sandbox.stub(encryption, 'encryptLambdaFinalResponse').resolves('mockFinalResponse');
    sandbox.stub(infoV2);
    sandbox.stub(logError);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully call awsApi and encryptLambdaFinalResponse', async () => {
    // Mock fetchParamterFromCache results
    mockLambdaArgs.authenticationResources.fetchParamterFromCache.withArgs(mockLambdaArgs.ssm, mockLambdaArgs.decryptHostSSMPath, false).resolves('mockAwsApiHost');
    mockLambdaArgs.authenticationResources.fetchParamterFromCache.withArgs(mockLambdaArgs.ssm, mockLambdaArgs.decryptKeySSMPath, false).resolves('mockAwsApiKey');
    mockLambdaArgs.authenticationResources.fetchParamterFromCache.withArgs(mockLambdaArgs.ssm, 'cert_value_centralized_nlb', false).resolves('mockRootCert');

    const result = await decryptedCiphertextAPI(mockLambdaArgs, mockFunctionArgs);

    // Verifications
    expect(result).to.equal('mockFinalResponse');
    expect(awsApi.prototype.doHttpOperation.calledOnce).to.be.true;
    expect(encryption.encryptLambdaFinalResponse.calledOnce).to.be.true;
    expect(infoV2.calledOnce).to.be.true;
  });

it('should log an error when an exception occurs', async () => {
    // Simulate an error in fetchParamterFromCache
    mockLambdaArgs.authenticationResources.fetchParamterFromCache
      .withArgs(mockLambdaArgs.ssm, mockLambdaArgs.decryptHostSSMPath, false)
      .rejects(new Error('Test Error')); // Use rejects to simulate an error

    const result = await decryptedCiphertextAPI(mockLambdaArgs, mockFunctionArgs);

    // Verifications
    expect(result).to.be.undefined;  // Ensure no result on failure
    expect(logError.calledOnce).to.be.true;  // Check if logError was called

    if (logError.called) {
        expect(logError.args[0][0]).to.include('Test Error');  // Ensure error message is logged
    } else {
        console.error('logError was not called');
    }
});



});
