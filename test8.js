const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const xml2js = require("xml2js");

describe('mapResponse', () => {
    let mapResponse;
    let logErrorStub;
    let xml2jsStub;
    let xml2jsProcessorsStub;

    beforeEach(() => {
        logErrorStub = sinon.stub();
        xml2jsStub = {
            Parser: sinon.stub().returns({
                parseString: sinon.stub()
            })
        };
        xml2jsProcessorsStub = { stripPrefix: sinon.stub() };

        mapResponse = proxyquire('../service/subService/amendInvolvedParty/mapResponse', {
            '@bmo-util/framework': { logError: logErrorStub, infoV2: sinon.stub() },
            'xml2js': xml2jsStub,
            'xml2js-processors': xml2jsProcessorsStub
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return an empty response object for a 200 status code', async () => {
        const mockResponse = { statusCode: 200, body: '<xml>sample</xml>' };
        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(200);
        expect(result.responseObject).to.deep.equal({});
    });

    it('should handle systemfault errors with transaction reference and additional text', (done) => {
        xml2jsStub.Parser().parseString.yields(null, {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: "fault:systemfault",
                        detail: {
                            systemFault: {
                                faultInfo: {
                                    additionalText: "System fault occurred",
                                    parameter: [{ key: "TRANSACTION_REFERENCE", value: "12345" }]
                                }
                            }
                        }
                    }
                }
            }
        });

        const mockResponse = { statusCode: 500, body: '<xml>sample</xml>' };
        mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse)
            .then((result) => {
                expect(result.statusCode).to.equal(500);
                expect(result.responseObject.detail).to.include("TRANSACTION_REFERENCE: 12345, System fault occurred");
                done();
            })
            .catch(done);
    });

    it('should handle data validation fault without transaction reference', (done) => {
        xml2jsStub.Parser().parseString.yields(null, {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: "fault:datavalidationfault",
                        detail: {
                            dataValidationFault: {
                                faultInfo: {}
                            }
                        }
                    }
                }
            }
        });

        const mockResponse = { statusCode: 400, body: '<xml>sample</xml>' };
        mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse)
            .then((result) => {
                expect(result.statusCode).to.equal(400);
                expect(result.responseObject.detail).to.include("TRANSACTION_REFERENCE: no TRANSACTION_REFERENCE found");
                done();
            })
            .catch(done);
    });

    it('should handle data access fault errors', (done) => {
        xml2jsStub.Parser().parseString.yields(null, {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: "fault:dataaccessfault",
                        detail: {
                            dataAccessFault: {
                                faultInfo: {
                                    parameter: [{ key: "TRANSACTION_REFERENCE", value: "67890" }]
                                }
                            }
                        }
                    }
                }
            }
        });

        const mockResponse = { statusCode: 403, body: '<xml>sample</xml>' };
        mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse)
            .then((result) => {
                expect(result.statusCode).to.equal(403);
                expect(result.responseObject.detail).to.include("TRANSACTION_REFERENCE: 67890");
                done();
            })
            .catch(done);
    });

    it('should throw an error and log when XML parsing fails', async () => {
        xml2jsStub.Parser().parseString.yields(new Error('Parsing Error'));

        const mockResponse = { statusCode: 500, body: '<xml>sample</xml>' };

        try {
            await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);
        } catch (error) {
            expect(logErrorStub.calledOnce).to.be.true;
            expect(logErrorStub.firstCall.args[0]).to.equal("err parse XML getInvolvedPartyResponse to JSON");
            expect(error.message).to.equal('Parsing Error');
        }
    });

    it('should handle unknown fault codes and return default error response', (done) => {
        xml2jsStub.Parser().parseString.yields(null, {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: "fault:unknownFault"
                    }
                }
            }
        });

        const mockResponse = { statusCode: 500, body: '<xml>sample</xml>' };
        mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse)
            .then((result) => {
                expect(result.statusCode).to.equal(500);
                expect(result.responseObject.title).to.equal("internal Server error");
                expect(result.responseObject.detail).to.include("MidTier AmendOCIFInvolved Service Failure");
                done();
            })
            .catch(done);
    });

    it('should handle missing faultcode gracefully', (done) => {
        xml2jsStub.Parser().parseString.yields(null, {
            Envelope: {
                Body: {
                    Fault: {}
                }
            }
        });

        const mockResponse = { statusCode: 500, body: '<xml>sample</xml>' };
        mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse)
            .then((result) => {
                expect(result.statusCode).to.equal(500);
                expect(result.responseObject.title).to.equal("MidTier AmendOCIFInvolved Service Failure");
                done();
            })
            .catch(done);
    });
});
