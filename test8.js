const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('amendInvolvedParty_CGtoOCIF', () => {
    let mapResponse;
    let logErrorStub;
    let parserStub;
    let mockParser;

    beforeEach(() => {
        logErrorStub = sinon.stub();
        mockParser = {
            parseString: sinon.stub()
        };

        const xml2jsStub = {
            Parser: sinon.stub().returns(mockParser)
        };

        const xml2jsProcessorsStub = {
            stripPrefix: sinon.stub().returnsArg(0) // Stub stripPrefix to return the passed argument (or whatever behavior you need)
        };

        mapResponse = proxyquire('../service/subService/amendInvolvedParty/mapResponse', {
            '@bmo-util/framework': { logError: logErrorStub, infoV2: sinon.stub() }, // Stub logError and infoV2
            'xml2js': xml2jsStub, // Stub xml2js to use the mock parser
            'xml2js-processors': xml2jsProcessorsStub // Mock the xml2js-processors and the stripPrefix function
        });
    });

    it('should return statusCode 200 and parsed responseObject when statusCode is 200', async () => {
        const mockResponse = {
            statusCode: 200,
            body: '<Envelope><Body><InvolvedPartyResponse>Valid Data</InvolvedPartyResponse></Body></Envelope>'
        };

        const parsedXmlData = {
            Envelope: {
                Body: {
                    InvolvedPartyResponse: 'Valid Data'
                }
            }
        };

        // Simulate successful XML parsing
        mockParser.parseString.yields(null, parsedXmlData);

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(mockParser.parseString.calledOnce).to.be.true;
        expect(result.statusCode).to.equal(200);
        expect(result.responseObject).to.deep.equal({});
    });

    it('should log and throw error when XML parsing fails', async () => {
        const mockResponse = {
            statusCode: 200,
            body: '<InvalidXml>'
        };

        const error = new Error('XML Parsing Error');

        // Simulate XML parsing failure
        mockParser.parseString.yields(error);

        await expect(mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse))
            .to.be.rejectedWith(error);

        expect(logErrorStub.calledOnce).to.be.true;
        expect(logErrorStub.calledWith('err parse XML getInvolvedPartyResponse to JSON', error)).to.be.true;
    });

    it('should return failure response object for systemfault errors', async () => {
        const mockResponse = {
            statusCode: 500,
            body: '<Envelope><Body><Fault><faultcode>systemfault</faultcode></Fault></Body></Envelope>'
        };

        const parsedXmlData = {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: 'systemfault',
                        detail: {
                            systemFault: {
                                faultInfo: {
                                    additionalText: 'System failure',
                                    parameter: [{ key: 'TRANSACTION_REFERENCE', value: '12345' }]
                                }
                            }
                        }
                    }
                }
            }
        };

        // Simulate successful XML parsing
        mockParser.parseString.yields(null, parsedXmlData);

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(500);
        expect(result.responseObject).to.deep.equal({
            type: 'failure',
            title: 'internal Server error',
            status: 500,
            detail: 'systemfault: TRANSACTION_REFERENCE: 12345, System failure'
        });
    });

    it('should return failure response object for datavalidationfault errors', async () => {
        const mockResponse = {
            statusCode: 400,
            body: '<Envelope><Body><Fault><faultcode>datavalidationfault</faultcode></Fault></Body></Envelope>'
        };

        const parsedXmlData = {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: 'datavalidationfault',
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

        // Simulate successful XML parsing
        mockParser.parseString.yields(null, parsedXmlData);

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(400);
        expect(result.responseObject).to.deep.equal({
            type: 'failure',
            title: 'internal Server error',
            status: 400,
            detail: 'datavalidationfault: TRANSACTION_REFERENCE: 67890'
        });
    });

    it('should return failure response object for dataaccessfault errors', async () => {
        const mockResponse = {
            statusCode: 500,
            body: '<Envelope><Body><Fault><faultcode>dataaccessfault</faultcode></Fault></Body></Envelope>'
        };

        const parsedXmlData = {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: 'dataaccessfault',
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

        // Simulate successful XML parsing
        mockParser.parseString.yields(null, parsedXmlData);

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(500);
        expect(result.responseObject).to.deep.equal({
            type: 'failure',
            title: 'internal Server error',
            status: 500,
            detail: 'dataaccessfault: TRANSACTION_REFERENCE: 54321'
        });
    });
});
