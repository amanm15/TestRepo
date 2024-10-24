const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire');

const sandbox = sinon.createSandbox();
let mockAmendInvolvedParty_OCIFtoCG;
let mockSendRequest;
let mockAmendInvolvedParty_CGtoOCIF;

describe('amendInvolvedParty', () => {
  let amendInvolvedParty;

  beforeEach(() => {
    // Create stubs for dependencies
    mockAmendInvolvedParty_OCIFtoCG = sandbox.stub();
    mockSendRequest = sandbox.stub();
    mockAmendInvolvedParty_CGtoOCIF = sandbox.stub();

    // Use proxyquire to replace the real dependencies with stubs
    amendInvolvedParty = proxyquire('./index', {
      '../amendInvolvedParty/mapRequest': {
        amendInvolvedParty_OCIFtoCG: mockAmendInvolvedParty_OCIFtoCG
      },
      '../sendRequest': {
        sendRequest: mockSendRequest
      },
      './mapResponse': {
        amendInvolvedParty_CGtoOCIF: mockAmendInvolvedParty_CGtoOCIF
      },
      '@bmo-util/framework': {
        logError: sandbox.stub(),
        infoV2: sandbox.stub(),
      }
    }).amendInvolvedParty;
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should call amendInvolvedParty_OCIFtoCG, sendRequest, and amendInvolvedParty_CGtoOCIF, and return the expected response', async () => {
    // Arrange
    const mockBody = { some: 'data' };
    const mockResponse = { statusCode: 200, responseObject: { some: 'response' } };

    mockAmendInvolvedParty_OCIFtoCG.resolves(mockBody);
    mockSendRequest.resolves(mockResponse);
    mockAmendInvolvedParty_CGtoOCIF.resolves(mockResponse);

    const args = {};
    const payload = {};

    // Act
    const result = await amendInvolvedParty(args, payload);

    // Assert
    expect(result).to.deep.equal(mockResponse);
    expect(mockAmendInvolvedParty_OCIFtoCG.calledOnce).to.be.true;
    expect(mockSendRequest.calledOnce).to.be.true;
    expect(mockAmendInvolvedParty_CGtoOCIF.calledOnce).to.be.true;
  });

  it('should log an error and throw if an exception occurs', async () => {
    const error = new Error('Test Error');
    mockAmendInvolvedParty_OCIFtoCG.rejects(error);

    const args = {};
    const payload = {};

    try {
      await amendInvolvedParty(args, payload);
    } catch (err) {
      expect(err).to.equal(error);
      expect(logError.calledOnce).to.be.true;
    }
  });
});
