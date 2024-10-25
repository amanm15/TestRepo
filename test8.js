const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const { expect } = chai;

describe('amendInvolvedParty_CGtoOCIF', function () {
    let mapResponse;
    let logErrorStub, xml2jsStub, parserStub;

    beforeEach(() => {
        logErrorStub = sinon.stub();

        // Stub for xml2js and its parser
        parserStub = {
            parseString: sinon.stub()
        };
        xml2jsStub = {
            Parser: sinon.stub().returns(parserStub)
        };

        // Proxyquire to replace actual dependencies with stubs
        mapResponse = proxyquire('../service/subService/amendInvolvedParty/mapResponse', {
            '@bmo-util/framework': { logError: logErrorStub, infoV2: sinon.stub() },
            'xml2js': xml2jsStub
        });
    });

    afterEach(() => {
        sinon.restore(); // Reset stubs after each test
    });

    it('should log and throw an error when XML parsing fails', async function () {
        const mockResponse = {
            statusCode: 200,
            body: '<invalidXML>' // Simulate invalid XML that will cause parsing error
        };
        const error = new Error('Parsing error');
        parserStub.parseString.yields(error, null); // Simulate parser throwing an error

        try {
            await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);
            // If we reach this line, the promise did not reject
            expect.fail('Expected promise to be rejected');
        } catch (err) {
            // Check that the error is the expected one
            expect(err).to.equal(error);
            // Ensure that logError was called
            sinon.assert.calledOnce(logErrorStub);
            sinon.assert.calledWith(logErrorStub, 'err parse XML getInvolvedPartyResponse to JSON', error);
        }
    });

    it('should return formatted response when statusCode is 200 and XML is valid', async function () {
        const mockResponse = {
            statusCode: 200,
            body: '<Envelope><Body><response>Success</response></Body></Envelope>'
        };
        const mockParsedData = { Envelope: { Body: { response: 'Success' } } };
        parserStub.parseString.yields(null, mockParsedData); // Simulate successful parsing

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result).to.deep.equal({
            statusCode: 200,
            responseObject: mockParsedData
        });
    });
});
