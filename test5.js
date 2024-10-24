delete require.cache[require.resolve('./index')];
delete require.cache[require.resolve('../amendInvolvedParty/mapRequest')];
delete require.cache[require.resolve('../sendRequest')];
delete require.cache[require.resolve('./mapResponse')];

const { expect } = require('chai');
const sinon = require('sinon');
const { amendInvolvedParty } = require('./index');
const { amendInvolvedParty_OCIFtoCG } = require('../amendInvolvedParty/mapRequest');
const { sendRequest } = require('../sendRequest');  // Ensure this path is correct
const { amendInvolvedParty_CGtoOCIF } = require('./mapResponse');
const { logError } = require('@bmo-util/framework');

describe('amendInvolvedParty', () => {
  let sandbox;
  let mockArgs;
  let mockPayload;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockArgs = { someArg: 'value' };
    mockPayload = { somePayload: 'data' };

    if (amendInvolvedParty_OCIFtoCG) {
      sandbox.stub(amendInvolvedParty_OCIFtoCG).resolves({ converted: 'body' });
    }
    if (sendRequest) {
      sandbox.stub(sendRequest).resolves({ some: 'response' });
    }
    if (amendInvolvedParty_CGtoOCIF) {
      sandbox.stub(amendInvolvedParty_CGtoOCIF).resolves({ statusCode: 200, responseObject: { some: 'responseObject' } });
    }
    sandbox.stub(logError);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should call amendInvolvedParty_OCIFtoCG, sendRequest, and amendInvolvedParty_CGtoOCIF, and return the expected response', async () => {
    const result = await amendInvolvedParty(mockArgs, mockPayload);

    expect(amendInvolvedParty_OCIFtoCG.calledOnceWithExactly(mockPayload)).to.be.true;
    expect(sendRequest.calledOnceWithExactly(mockArgs, { converted: 'body' })).to.be.true;
    expect(amendInvolvedParty_CGtoOCIF.calledOnceWithExactly({ some: 'response' })).to.be.true;

    expect(result).to.deep.equal({
      statusCode: 200,
      responseObject: { some: 'responseObject' }
    });
  });

  it('should log and throw an error if any function throws an error', async () => {
    const error = new Error('Test Error');
    amendInvolvedParty_OCIFtoCG.rejects(error);

    try {
      await amendInvolvedParty(mockArgs, mockPayload);
    } catch (err) {
      expect(err).to.equal(error);
      expect(logError.calledOnceWithExactly('error invoking amendInvolvedParty', error)).to.be.true;
    }
  });
});
