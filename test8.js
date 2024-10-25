const proxyquire = require('proxyquire');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(sinonChai);
chai.use(chaiAsPromised);
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
                parseString: sinon.stub() // Mock parser's parseString method
            })
        };

        xml2jsProcessorsStub = {
            stripPrefix: sinon.stub() // Mock the stripPrefix method
        };

        mapResponse = proxyquire('../service/subService/amendInvolvedParty/mapResponse', {
            '@bmo-util/framework': { logError: logErrorStub, infoV2: sinon.stub() }, // Stub logError and infoV2
            'xml2js': xml2jsStub, // Stub xml2js to use the mock parser
            'xml2js-processors': xml2jsProcessorsStub // Mock the xml2js-processors and the stripPrefix function
        });
    });

    afterEach(() => {
        sinon.restore(); // Restore all mocks after each test
    });

    it('should log and return a successful response when statusCode is 200', async () => {
        const mockResponse = {
            statusCode: 200,
            body: '<xml><Envelope><Body><Success>Data</Success></Body></Envelope>'
        };

        const mockParsedData = {
            Envelope: {
                Body: {
                    Success: 'Data'
                }
            }
        };

        // Stub parseString to return mock parsed JSON data
        xml2jsStub.Parser().parseString.callsArgWith(1, null, mockParsedData);

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result).to.deep.equal({
            statusCode: 200,
            responseObject: mockParsedData
        });
    });

    it('should log and throw error when XML parsing fails', async () => {
        const mockResponse = {
            statusCode: 200,
            body: 'invalid XML'
        };

        // Simulate a parsing error
        xml2jsStub.Parser().parseString.callsArgWith(1, new Error('XML Parsing Error'), null);

        const error = new Error('XML Parsing Error');

        await expect(mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse))
            .to.be.rejectedWith(error);

        expect(logErrorStub).to.have.been.calledWith('err parse XML getInvolvedPartyResponse to JSON', error);
    });

    it('should return error response when statusCode is not 200', async () => {
        const mockResponse = {
            statusCode: 400,
            body: '<xml><Envelope><Body><Fault><faultcode>Error</faultcode></Fault></Body></Envelope>'
        };

        const mockParsedError = {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: 'Error'
                    }
                }
            }
        };

        // Stub parseString to return mock error data
        xml2jsStub.Parser().parseString.callsArgWith(1, null, mockParsedError);

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result).to.deep.equal({
            statusCode: 400,
            responseObject: {
                type: 'failure',
                title: 'internal Server error',
                status: 400,
                detail: 'MidTier AmendOCIFInvolved Service Failure'
            }
        });
    });
});
