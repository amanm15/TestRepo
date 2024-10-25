const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

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
            'xml2js-processors': { stripPrefix: sinon.stub() }
        });
    });

    it('should successfully parse a valid XML response', async () => {
        const mockResponse = { statusCode: 200, body: '<xml></xml>' };
        xml2jsStub.Parser().parseString.yields(null, { response: 'parsed' });

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(200);
        expect(result.responseObject).to.be.an('object');
    });

    it('should log and throw error when XML parsing fails', async () => {
        const mockResponse = { statusCode: 200, body: '<xml></xml>' };
        const error = new Error('Parsing Error');
        xml2jsStub.Parser().parseString.yields(error, null);

        try {
            await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);
        } catch (err) {
            expect(logErrorStub.calledWith('err parse XML get InvolvedPartyResponse to JSON', error)).to.be.true;
            expect(err).to.equal(error);
        }
    });

    it('should return a formatted system fault error response', async () => {
        const mockResponse = { statusCode: 500, body: '<xml></xml>' };
        const parsedJsonData = {
            Envelope: {
                Body: {
                    Fault: {
                        detail: {
                            systemFault: {
                                faultInfo: {
                                    additionalText: 'Some additional info',
                                    parameter: [{ key: 'TRANSACTION_REFERENCE', value: '12345' }]
                                }
                            }
                        }
                    }
                }
            }
        };
        xml2jsStub.Parser().parseString.yields(null, parsedJsonData);

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.responseObject.detail).to.include('systemfault: TRANSACTION_REFERENCE: 12345, Some additional info');
    });

    it('should return a formatted datavalidationfault error response', async () => {
        const mockResponse = { statusCode: 500, body: '<xml></xml>' };
        const parsedJsonData = {
            Envelope: {
                Body: {
                    Fault: {
                        detail: {
                            dataValidationFault: {
                                faultInfo: {
                                    parameter: [{ key: 'TRANSACTION_REFERENCE', value: '67890' }]
                                }
                            }
                        }
                    }
                }
            }
        };
        xml2jsStub.Parser().parseString.yields(null, parsedJsonData);

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.responseObject.detail).to.include('datavalidationfault: TRANSACTION_REFERENCE: 67890');
    });

    it('should return a formatted dataaccessfault error response', async () => {
        const mockResponse = { statusCode: 500, body: '<xml></xml>' };
        const parsedJsonData = {
            Envelope: {
                Body: {
                    Fault: {
                        detail: {
                            dataAccessFault: {
                                faultInfo: {
                                    parameter: [{ key: 'TRANSACTION_REFERENCE', value: '54321' }]
                                }
                            }
                        }
                    }
                }
            }
        };
        xml2jsStub.Parser().parseString.yields(null, parsedJsonData);

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.responseObject.detail).to.include('dataaccessfault: TRANSACTION_REFERENCE: 54321');
    });

    // Test cases for extractTransactionReference function
    it('should return TRANSACTION_REFERENCE if found in parameters array', () => {
        const parameters = [{ key: 'TRANSACTION_REFERENCE', value: '12345' }];
        const result = mapResponse.extractTransactionReference(parameters);
        expect(result).to.equal('12345');
    });

    it('should return "no TRANSACTION_REFERENCE found" if TRANSACTION_REFERENCE is not found in parameters array', () => {
        const parameters = [{ key: 'OTHER_KEY', value: '67890' }];
        const result = mapResponse.extractTransactionReference(parameters);
        expect(result).to.equal('no TRANSACTION_REFERENCE found');
    });

    it('should return parameters value if input is not an array', () => {
        const parameters = { value: '67890' };
        const result = mapResponse.extractTransactionReference(parameters);
        expect(result).to.equal('67890');
    });

    it('should return "no TRANSACTION_REFERENCE found" if parameters are undefined', () => {
        const parameters = undefined;
        const result = mapResponse.extractTransactionReference(parameters);
        expect(result).to.equal('no TRANSACTION_REFERENCE found');
    });
});
