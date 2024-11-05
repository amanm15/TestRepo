const chaiAsPromised = require("chai-as-promised");
const chai = require("chai");
chai.use(chaiAsPromised);
const proxyquire = require("proxyquire");
const sinon = require("sinon");
const assert = require("assert");
const { decryptedCiphertextAPI } = require('../service/subService/ALE/index.js');
const awsApi = require("../../utilities/apiCall/awsApi");

describe('Testing aleindex.js', function () {
  let infoV2Stub = sinon.stub().returns();
  let logErrorStub = sinon.stub();
  let awsApiStub = sinon.stub();

  before(function () {
    proxyquire('../service/subService/ALE/index.js', {
      "@bmo-util/framework": {
        infoV2: infoV2Stub,
        logError: logErrorStub
      },
      "../../../../utilities/apiCall/awsApi": {
        awsApi: awsApiStub
      }
    });
  });

  afterEach(() => {
    sinon.reset(); // Reset the state before each test
  });

  it("should successfully call decryptedCiphertextAPI and return response", async function () {
    // Arrange
    const args = {
      ssm: {},
      authenticationResources: {
        fetchParamterFromCache: sinon.stub().resolves('mockedHost')
      },
      decryptHostSSMPath: 'mockedPath'
    };
    const functionArgs = {
      appCatId: 'appCatId',
      xCyptoKey: 'mockCryptoKey',
      decryptLambdaUri: 'mockLambdaUri',
      DecryptedCiphertextpayload: 'mockPayload',
      retrieveDecryptedCiphertextLambdaName: 'mockLambdaName'
    };

    awsApiStub.returns({
      doHttpOperation: sinon.stub().resolves({ success: true }) // Mocking the API response
    });

    // Act
    const response = await decryptedCiphertextAPI(args, functionArgs);

    // Assert
    assert.deepEqual(response, { success: true });
    assert(infoV2Stub.calledOnce);
  });

  it("should log an error when an exception occurs", async function () {
    // Arrange
    const args = {
      ssm: {},
      authenticationResources: {
        fetchParamterFromCache: sinon.stub().rejects(new Error("Cache fetch error"))
      }
    };
    const functionArgs = {
      appCatId: 'appCatId',
      xCyptoKey: 'mockCryptoKey',
      decryptLambdaUri: 'mockLambdaUri',
      DecryptedCiphertextpayload: 'mockPayload',
      retrieveDecryptedCiphertextLambdaName: 'mockLambdaName'
    };

    // Act
    await decryptedCiphertextAPI(args, functionArgs).catch(err => {
      // Assert
      assert(logErrorStub.calledOnce);
      assert(logErrorStub.calledWithMatch(/err in ALE filename:/));
      assert.equal(err.message, "Cache fetch error");
    });
  });

  it("should throw an error when doHttpOperation fails", async function () {
    // Arrange
    const args = {
      ssm: {},
      authenticationResources: {
        fetchParamterFromCache: sinon.stub().resolves('mockedHost')
      }
    };
    const functionArgs = {
      appCatId: 'appCatId',
      xCyptoKey: 'mockCryptoKey',
      decryptLambdaUri: 'mockLambdaUri',
      DecryptedCiphertextpayload: 'mockPayload',
      retrieveDecryptedCiphertextLambdaName: 'mockLambdaName'
    };

    awsApiStub.returns({
      doHttpOperation: sinon.stub().rejects(new Error("API error")) // Mocking API failure
    });

    // Act & Assert
    await chai.expect(decryptedCiphertextAPI(args, functionArgs)).to.be.rejectedWith("API error");
  });
  
  it("should handle missing parameters gracefully", async function () {
    // Arrange
    const args = {
      ssm: {},
      authenticationResources: {
        fetchParamterFromCache: sinon.stub().resolves('mockedHost')
      }
    };
    const functionArgs = {
      appCatId: null, // Missing appCatId
      xCyptoKey: 'mockCryptoKey',
      decryptLambdaUri: 'mockLambdaUri',
      DecryptedCiphertextpayload: 'mockPayload',
      retrieveDecryptedCiphertextLambdaName: 'mockLambdaName'
    };

    // Act
    await decryptedCiphertextAPI(args, functionArgs).catch(err => {
      // Assert
      assert(logErrorStub.calledOnce);
      assert.include(err.message, 'Cannot read property');
    });
  });
});
