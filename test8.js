const chai = require('chai');
const { expect } = chai;
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('mapResponse', () => {
    let mapResponse, xml2jsStub, logErrorStub, mockResponse;

    beforeEach(() => {
        // Stubbing logError
        logErrorStub = sinon.stub();

        // Mocking xml2js parser
        xml2jsStub = {
            Parser: function() {
                return {
                    parseString: sinon.stub()
                };
            }
        };

        // Requiring mapResponse with stubs
        mapResponse = proxyquire('../service/subService/amendInvolvedParty/mapResponse', {
            '@bmo-util/framework': { logError: logErrorStub },
            'xml2js': xml2jsStub
        });

        // Mock response object
        mockResponse = {
            statusCode: 200,
            body: '<Envelope><Body><Fault><faultcode>systemfault</faultcode></Fault></Body></Envelope>'
        };
    });

    it('should successfully parse a valid XML response', async () => {
        xml2jsStub.Parser().parseString.yields(null, { Envelope: { Body: { Fault: { faultcode: 'systemfault' } } } });

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(200);
        expect(result.responseObject).to.be.an('object');
    });

    it('should log and throw an error when XML parsing fails', async () => {
        const error = new Error('Parsing Error');
        xml2jsStub.Parser().parseString.yields(error, null);

        try {
            await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);
        } catch (err) {
            expect(logErrorStub.calledOnce).to.be.true;
            expect(err).to.equal(error);
        }
    });

    it('should return a formatted system fault error response', async () => {
        xml2jsStub.Parser().parseString.yields(null, {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: 'systemfault',
                        detail: {
                            systemFault: {
                                faultInfo: {
                                    additionalText: 'Test additional text',
                                    parameter: [
                                        { key: 'TRANSACTION_REFERENCE', value: '12345' }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        });

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(200);
        expect(result.responseObject.detail).to.include('TRANSACTION_REFERENCE: 12345');
        expect(result.responseObject.detail).to.include('Test additional text');
    });

    it('should return a data validation fault error response', async () => {
        mockResponse.body = '<Envelope><Body><Fault><faultcode>datavalidationfault</faultcode></Fault></Body></Envelope>';
        xml2jsStub.Parser().parseString.yields(null, {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: 'datavalidationfault',
                        detail: {
                            dataValidationFault: {
                                faultInfo: {
                                    parameter: [
                                        { key: 'TRANSACTION_REFERENCE', value: '67890' }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        });

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(200);
        expect(result.responseObject.detail).to.include('TRANSACTION_REFERENCE: 67890');
    });

    it('should handle non-200 status code response', async () => {
        mockResponse.statusCode = 500;

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(500);
        expect(result.responseObject).to.be.undefined;
    });
});
