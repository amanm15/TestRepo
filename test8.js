const { amendInvolvedParty_CGtoOCIF } = require('../service/subService/amendInvolvedParty/mapResponse');
const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const { expect } = chai;

describe('mapResponse', () => {
    let mapResponse;
    let logErrorStub;
    let xml2jsStub;

    beforeEach(() => {
        logErrorStub = sinon.stub();
        xml2jsStub = {
            Parser: sinon.stub().returns({
                parseString: sinon.stub()
            })
        };

        mapResponse = proxyquire('../service/subService/amendInvolvedParty/mapResponse', {
            '@bmo-util/framework': { logError: logErrorStub, infoV2: sinon.stub() },
            'xml2js': xml2jsStub,
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return a default error response when faultcode is undefined', async () => {
        xml2jsStub.Parser().parseString.yields(null, { Envelope: { Body: { Fault: {} } } }); // No faultcode

        const mockResponse = { statusCode: 500, body: '<xml>sample</xml>' };
        const result = await amendInvolvedParty_CGtoOCIF(mockResponse);
        
        expect(result.statusCode).to.equal(500);
        expect(result.responseObject.title).to.equal('MidTier AmendOCIFInvolved Service Failure');
        expect(result.responseObject.detail).to.equal('MidTier AmendOCIFInvolved Service Failure');
    });

    it('should return a formatted error response for a valid system fault', async () => {
        xml2jsStub.Parser().parseString.yields(null, {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: "fault:systemFault",
                        detail: {
                            systemFault: {
                                faultInfo: {
                                    additionaltext: "An error occurred",
                                    parameter: [
                                        { key: "TRANSACTION_REFERENCE", value: "12345" }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        });

        const mockResponse = { statusCode: 500, body: '<xml>sample</xml>' };
        const result = await amendInvolvedParty_CGtoOCIF(mockResponse);
        
        expect(result.statusCode).to.equal(500);
        expect(result.responseObject.detail).to.include('TRANSACTION_REFERENCE: 12345');
        expect(result.responseObject.detail).to.include('An error occurred');
    });

    it('should return an empty response object when statusCode is 200', async () => {
        const mockResponse = { statusCode: 200, body: '<xml>sample</xml>' };
        const result = await amendInvolvedParty_CGtoOCIF(mockResponse);
        
        expect(result.statusCode).to.equal(200);
        expect(result.responseObject).to.deep.equal({});
    });

    it('should log error and throw when XML parsing fails', async () => {
        xml2jsStub.Parser().parseString.yields(new Error('Parsing Error'), null); // Simulate parsing error

        const mockResponse = { statusCode: 500, body: '<xml>sample</xml>' };

        try {
            await amendInvolvedParty_CGtoOCIF(mockResponse);
        } catch (error) {
            expect(logErrorStub.calledOnce).to.be.true;
            expect(logErrorStub.firstCall.args[0]).to.equal("err parse XML getInvolvedPartyResponse to JSON");
            expect(logErrorStub.firstCall.args[1].message).to.equal('Parsing Error');
            expect(error.message).to.equal('Parsing Error');
        }
    });

    it('should return a formatted error response for a data validation fault', async () => {
        xml2jsStub.Parser().parseString.yields(null, {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: "fault:datavalidationfault",
                        detail: {
                            dataValidationFault: {
                                faultInfo: {
                                    parameter: [
                                        { key: "TRANSACTION_REFERENCE", value: "54321" }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        });

        const mockResponse = { statusCode: 400, body: '<xml>sample</xml>' };
        const result = await amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(400);
        expect(result.responseObject.detail).to.include('TRANSACTION_REFERENCE: 54321');
    });

    it('should return a formatted error response for a data access fault', async () => {
        xml2jsStub.Parser().parseString.yields(null, {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: "fault:dataaccessfault",
                        detail: {
                            dataAccessFault: {
                                faultInfo: {
                                    parameter: [
                                        { key: "TRANSACTION_REFERENCE", value: "67890" }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        });

        const mockResponse = { statusCode: 403, body: '<xml>sample</xml>' };
        const result = await amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(403);
        expect(result.responseObject.detail).to.include('TRANSACTION_REFERENCE: 67890');
    });
});
