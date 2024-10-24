const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('updateEtchData', () => {
  let sandbox;
  let updateEtchData;
  let amendInvolvedPartyStub;
  let getCorrelationIdStub;
  let infoV2Stub;
  let logErrorStub;

  let mockArgs;
  let mockPayload;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Stubbing dependencies
    amendInvolvedPartyStub = sandbox.stub().resolves({
      statuscode: 200,
      responseobject: { key: 'value' }
    });
    getCorrelationIdStub = sandbox.stub().returns('mockCorrelationId');
    infoV2Stub = sandbox.stub();
    logErrorStub = sandbox.stub();

    // Proxyquire the file and inject the stubs
    updateEtchData = proxyquire('../updateEtchData', {
      '@bmo-util/framework': {
        getCorrelationId: getCorrelationIdStub,
        infoV2: infoV2Stub,
        logError: logErrorStub
      },
      '../subservice/amendInvolvedParty': {
        amendInvolvedParty: amendInvolvedPartyStub
      }
    });

    mockArgs = {
      headers: {
        'x-fapi-interaction-id': 'mockInteractionId',
        'x-client-id': 'mockClientId'
      }
    };

    mockPayload = { /* Your mock payload */ };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return a valid response when amendInvolvedParty succeeds with status 200', async () => {
    const result = await updateEtchData(mockPayload, mockArgs);

    expect(amendInvolvedPartyStub.calledOnce).to.be.true;
    expect(result).to.have.property('statusCode', 200);
    expect(result.headers).to.include({
      'x-request-id': 'mockCorrelationId',
      'x-fapi-interaction-id': 'mockInteractionId',
      'x-client-id': 'mockClientId'
    });
    expect(infoV2Stub.calledOnce).to.be.true;
  });

  it('should return a 400 error response and log error when amendInvolvedParty throws an error', async () => {
    amendInvolvedPartyStub.rejects(new Error('Test Error'));

    const result = await updateEtchData(mockPayload, mockArgs);

    expect(logErrorStub.calledOnce).to.be.true;
    expect(logErrorStub.args[0][0]).to.include('error in updateEtchdata lambda');
    expect(result).to.have.property('statusCode', '400');
    expect(result.body).to.include('Test Error');
  });

  it('should default headers if they are not provided', async () => {
    const argsWithoutHeaders = {}; // No headers in args
    const result = await updateEtchData(mockPayload, argsWithoutHeaders);

    expect(result.headers).to.include({
      'x-request-id': 'mockCorrelationId',
      'x-fapi-interaction-id': '987654321', // Default value
      'x-client-id': '000' // Default value
    });
  });

  it('should include response body when status code is not 200', async () => {
    amendInvolvedPartyStub.resolves({
      statuscode: 400,
      responseobject: { error: 'some error' }
    });

    const result = await updateEtchData(mockPayload, mockArgs);

    expect(result).to.have.property('statusCode', 400);
    expect(result.body).to.include(JSON.stringify({ error: 'some error' }));
  });
});
