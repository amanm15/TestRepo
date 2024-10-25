const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

describe('mapResponse', () => {
    let mapResponse;
    let logErrorStub;
    let xml2jsStub;
    let mockResponse;

    beforeEach(() => {
        logErrorStub = sinon.stub();
        xml2jsStub = {
            Parser: sinon.stub().returns({
                parseString: sinon.stub()
            })
        };

        mapResponse = proxyquire('../service/subService/amendInvolvedParty/mapResponse', {
            '@bmo-util/framework': { logError: logErrorStub },
            'xml2js': xml2jsStub
        });

        mockResponse = {
            statusCode: 500,
            body: '<Envelope><Body><Fault><faultcode>systemfault</faultcode></Fault></Body></Envelope>'
        };
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

        // Defensive check for the responseObject and detail existence
        expect(result.responseObject).to.have.property('detail');
        expect(result.responseObject.detail).to.be.a('string');

        // Ensure detail includes transaction reference and additional text
        expect(result.responseObject.detail).to.include('TRANSACTION_REFERENCE: 12345');
        expect(result.responseObject.detail).to.include('Test additional text');
    });

    it('should log and throw error when XML parsing fails', async () => {
        xml2jsStub.Parser().parseString.yields(new Error('Parsing Error'), null);

        try {
            await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);
        } catch (err) {
            expect(logErrorStub.calledOnce).to.be.true;
            expect(logErrorStub.args[0][0]).to.equal('err parse XML get InvolvedPartyResponse to JSON');
            expect(err.message).to.equal('Parsing Error');
        }
    });

    it('should return an empty responseObject if status code is 200', async () => {
        mockResponse.statusCode = 200;

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(200);
        expect(result.responseObject).to.deep.equal({});
    });
});
