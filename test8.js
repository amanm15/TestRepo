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

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(response);

        expect(result).to.deep.equal({
            statusCode: 200,
            responseObject: {}, // Replace with expected response based on parsing
        });
    });

    it('should log and throw error when XML parsing fails', async () => {
        const response = { statusCode: 200, body: '<xml></xml>' };

        // Simulate an XML parsing error
        xml2jsStub.Parser().parseString = (xml, callback) => {
            callback(new Error('Parsing Error'), null);
        };

        let error;
        try {
            await mapResponse.amendInvolvedParty_CGtoOCIF(response);
        } catch (err) {
            error = err;
        }

        // Verify that the error was thrown and logged
        expect(error).to.exist;
        expect(error.message).to.equal('Parsing Error');
        expect(logErrorStub.calledOnce).to.be.true;
    });

    it('should return formatted error response for system fault', async () => {
        const response = {
            statusCode: 200,
            body: `
                <Envelope>
                    <Body>
                        <Fault>
                            <faultcode>systemfault</faultcode>
                            <faultstring>Internal Server Error</faultstring>
                            <detail>
                                <systemFault>
                                    <faultInfo>
                                        <additionalText>Error details</additionalText>
                                    </faultInfo>
                                </systemFault>
                            </detail>
                        </Fault>
                    </Body>
                </Envelope>
            `,
        };

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(response);

        expect(result).to.deep.equal({
            statusCode: 200,
            responseObject: {
                type: 'failure',
                title: 'MidTier AmendOCIFInvolved Service Failure',
                status: 200,
                detail: 'systemfault: TRANSACTION_REFERENCE: no TRANSACTION_REFERENCE found, Error details',
            },
        });
    });

    it('should return formatted error response for data validation fault', async () => {
        const response = {
            statusCode: 200,
            body: `
                <Envelope>
                    <Body>
                        <Fault>
                            <faultcode>datavalidationfault</faultcode>
                            <faultstring>Data Validation Error</faultstring>
                            <detail>
                                <dataValidationFault>
                                    <faultInfo>
                                        <parameter>Invalid parameter</parameter>
                                    </faultInfo>
                                </dataValidationFault>
                            </detail>
                        </Fault>
                    </Body>
                </Envelope>
            `,
        };

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(response);

        expect(result).to.deep.equal({
            statusCode: 200,
            responseObject: {
                type: 'failure',
                title: 'MidTier AmendOCIFInvolved Service Failure',
                status: 200,
                detail: 'datavalidationfault: TRANSACTION_REFERENCE: no TRANSACTION_REFERENCE found*',
            },
        });
    });

    // Additional test cases for other error types can be added here...
});
