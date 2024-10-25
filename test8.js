const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const { expect } = chai;

describe('mapResponse', () => {
    let mapResponse;
    let logErrorStub;
    let xml2jsStub;
    let xml2jsProcessorsStub;

    beforeEach(() => {
        logErrorStub = sinon.stub();
        xml2jsStub = {
            Parser: sinon.stub().returns({
                parseString: sinon.stub().yields(null, {
                    Envelope: {
                        Body: {
                            Fault: { faultcode: "fault:systemFault" }
                        }
                    }
                })
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

    it('should return a default error response when faultcode is undefined', (done) => {
        xml2jsStub.Parser().parseString = (xml, callback) => {
            callback(null, { Envelope: { Body: { Fault: {} } } }); // No faultcode
        };

        const mockResponse = { statusCode: 500, body: '<xml>sample</xml>' };
        mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse)
            .then((result) => {
                expect(result.statusCode).to.equal(500);
                expect(result.responseObject.title).to.equal('MidTier AmendOCIFInvolved Service Failure');
                expect(result.responseObject.detail).to.equal('MidTier AmendOCIFInvolved Service Failure');
                done();
            })
            .catch(done);
    });

    it('should return a default error response when faultcode is missing', (done) => {
        xml2jsStub.Parser().parseString = (xml, callback) => {
            callback(null, { Envelope: { Body: {} } }); // Fault section missing
        };

        const mockResponse = { statusCode: 500, body: '<xml>sample</xml>' };
        mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse)
            .then((result) => {
                expect(result.statusCode).to.equal(500);
                expect(result.responseObject.title).to.equal('MidTier AmendOCIFInvolved Service Failure');
                expect(result.responseObject.detail).to.equal('MidTier AmendOCIFInvolved Service Failure');
                done();
            })
            .catch(done);
    });

    it('should return a formatted error response for a valid system fault', (done) => {
        xml2jsStub.Parser().parseString = (xml, callback) => {
            callback(null, {
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
        };

        const mockResponse = { statusCode: 500, body: '<xml>sample</xml>' };
        mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse)
            .then((result) => {
                expect(result.statusCode).to.equal(500);
                expect(result.responseObject.detail).to.include('TRANSACTION_REFERENCE: 12345');
                expect(result.responseObject.detail).to.include('An error occurred');
                done();
            })
            .catch(done);
    });

    it('should return TRANSACTION_REFERENCE if found in parameters array', () => {
        const parameters = [{ key: "TRANSACTION_REFERENCE", value: "12345" }];
        const result = mapResponse.extractTransactionReference(parameters);

        expect(result).to.equal("12345");
    });

    it('should return default message if TRANSACTION_REFERENCE not found in parameters array', () => {
        const parameters = [{ key: "ANOTHER_KEY", value: "67890" }];
        const result = mapResponse.extractTransactionReference(parameters);

        expect(result).to.equal("no TRANSACTION REFERENCE found");
    });

    it('should return a formatted error response for a data validation fault', (done) => {
        xml2jsStub.Parser().parseString = (xml, callback) => {
            callback(null, {
                Envelope: {
                    Body: {
                        Fault: {
                            faultcode: "fault:datavalidationfault",
                            detail: {
                                datavalidationFault: {
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
        };

        const mockResponse = { statusCode: 400, body: '<xml>sample</xml>' };
        mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse)
            .then((result) => {
                expect(result.statusCode).to.equal(400);
                expect(result.responseObject.detail).to.include('TRANSACTION REFERENCE: 54321');
                done();
            })
            .catch(done);
    });

    it('should return a formatted error response for a data access fault', (done) => {
        xml2jsStub.Parser().parseString = (xml, callback) => {
            callback(null, {
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
        };

        const mockResponse = { statusCode: 403, body: '<xml>sample</xml>' };
        mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse)
            .then((result) => {
                expect(result.statusCode).to.equal(403);
                expect(result.responseObject.detail).to.include('TRANSACTION_REFERENCE: 67890');
                done();
            })
            .catch(done);
    });
});
