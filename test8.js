const proxyquire = require('proxyquire');
const { expect } = require('chai');
const sinon = require('sinon');

// Stubs for dependencies
const logErrorStub = sinon.stub();
const xml2jsStub = {
    Parser: sinon.stub().returns({
        parseString: (xml, callback) => {
            // Default behavior for successful parsing
            callback(null, { Envelope: { Body: { Fault: {} } } });
        },
    }),
};

const mapResponse = proxyquire('../service/subService/amendInvolvedParty/mapResponse', {
    '@bmo-util/framework': { logError: logErrorStub },
    'xml2js': xml2jsStub,
});

describe('mapResponse', () => {
    afterEach(() => {
        sinon.reset();
    });

    it('should successfully parse a valid XML response', async () => {
        const response = { statusCode: 200, body: '<xml></xml>' };

        const result = await mapResponse.amendInvolvedParty_CGtoCIF(response);

        expect(result).to.deep.equal({
            statusCode: 200,
            responseObject: {}, // Replace with expected response based on parsing
        });
    });

    it('should log and throw an error when XML parsing fails', async () => {
        xml2jsStub.Parser.returns({
            parseString: (xml, callback) => {
                callback(new Error('Parsing error'));
            },
        });

        const response = { statusCode: 200, body: '<xml></xml>' };

        await expect(mapResponse.amendInvolvedParty_CGtoCIF(response)).to.be.rejected;
        expect(logErrorStub.calledOnce).to.be.true;
    });

    it('should handle system fault type in the response', async () => {
        xml2jsStub.Parser.returns({
            parseString: (xml, callback) => {
                callback(null, {
                    Envelope: {
                        Body: {
                            Fault: {
                                faultcode: 'systemfault',
                                detail: {
                                    systemFault: {
                                        faultInfo: {
                                            additionalText: 'Some additional info',
                                        },
                                    },
                                },
                            },
                        },
                    },
                });
            },
        });

        const response = { statusCode: 200, body: '<xml></xml>' };

        const result = await mapResponse.amendInvolvedParty_CGtoCIF(response);

        expect(result).to.have.property('statusCode', 200);
        expect(result.responseObject).to.have.property('type', 'failure');
        expect(result.responseObject).to.have.property('title').that.equals('MidTier AmendOCIFInvolved Service Failure');
    });

    it('should handle data validation fault type in the response', async () => {
        xml2jsStub.Parser.returns({
            parseString: (xml, callback) => {
                callback(null, {
                    Envelope: {
                        Body: {
                            Fault: {
                                faultcode: 'datavalidationfault',
                                detail: {
                                    dataValidationFault: {
                                        faultInfo: {},
                                    },
                                },
                            },
                        },
                    },
                });
            },
        });

        const response = { statusCode: 200, body: '<xml></xml>' };

        const result = await mapResponse.amendInvolvedParty_CGtoCIF(response);

        expect(result).to.have.property('statusCode', 200);
        expect(result.responseObject).to.have.property('type', 'failure');
        expect(result.responseObject).to.have.property('title').that.equals('MidTier AmendOCIFInvolved Service Failure');
    });

    it('should return a default message when no TRANSACTION_REFERENCE is found', async () => {
        xml2jsStub.Parser.returns({
            parseString: (xml, callback) => {
                callback(null, {
                    Envelope: {
                        Body: {
                            Fault: {
                                faultcode: 'systemfault',
                                detail: {
                                    systemFault: {
                                        faultInfo: {},
                                    },
                                },
                            },
                        },
                    },
                });
            },
        });

        const response = { statusCode: 200, body: '<xml></xml>' };

        const result = await mapResponse.amendInvolvedParty_CGtoCIF(response);

        expect(result).to.have.property('statusCode', 200);
        expect(result.responseObject).to.have.property('type', 'failure');
        expect(result.responseObject).to.have.property('title').that.equals('MidTier AmendOCIFInvolved Service Failure');
        expect(result.responseObject).to.include.keys('detail'); // Ensure detail is included
    });

    it('should handle empty response body gracefully', async () => {
        const response = { statusCode: 200, body: '' };

        await expect(mapResponse.amendInvolvedParty_CGtoCIF(response)).to.be.rejected;
        expect(logErrorStub.calledOnce).to.be.true;
    });

    it('should handle invalid XML response gracefully', async () => {
        const response = { statusCode: 200, body: '<invalid>' };

        await expect(mapResponse.amendInvolvedParty_CGtoCIF(response)).to.be.rejected;
        expect(logErrorStub.calledOnce).to.be.true;
    });
});
