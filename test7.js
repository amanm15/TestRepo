const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('sendRequest', () => {
  let sendRequest;
  let mutualSSLStub;
  let getCachedValueStub;
  let frameworkStub;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Stubbing external dependencies
    mutualSSLStub = sandbox.stub();
    getCachedValueStub = sandbox.stub();
    frameworkStub = {
      infoV2: sandbox.stub(),
      getCorrelationId: sandbox.stub().returns('mockCorrelationId'),
      logError: sandbox.stub(),
    };

    // Using proxyquire to inject stubs
    sendRequest = proxyquire('../sendRequest', {
      '@bmo-util/framework': frameworkStub,
      '../../../../utilities/MutualSSLOps/operations': {
        mutualSSL_SM: mutualSSLStub,
      },
      '../../../../utilities/cacheHandler/cacheHandler': {
        getcachedvalue: getCachedValueStub,
      },
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully send a request and return a response', async () => {
    // Arrange
    getCachedValueStub.withArgs('server_cert_value').resolves('mockServerCertValue');
    getCachedValueStub.withArgs('client_root_cert_value').resolves('mockClientRootCertValue');
    
    const mockArgs = { sm: 'mockSM' };
    const mockBody = '<xml>request</xml>';
    const mockResponse = { statusCode: 200, data: 'success' };

    mutualSSLStub.resolves(mockResponse);

    // Act
    const result = await sendRequest(mockArgs, mockBody);

    // Assert
    expect(result).to.equal(mockResponse);
    expect(getCachedValueStub.calledTwice).to.be.true;
    expect(mutualSSLStub.calledOnce).to.be.true;
    expect(frameworkStub.infoV2.calledOnce).to.be.true;
  });

  it('should log and throw an error when mutualSSL_SM fails', async () => {
    // Arrange
    const mockError = new Error('SSL Error');
    mutualSSLStub.rejects(mockError);

    const mockArgs = { sm: 'mockSM' };
    const mockBody = '<xml>request</xml>';

    // Act & Assert
    await expect(sendRequest(mockArgs, mockBody)).to.be.rejectedWith('SSL Error');
    expect(frameworkStub.logError.calledOnce).to.be.true;
  });
});
