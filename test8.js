const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire");

describe("amendInvolvedParty_CGtoOCIF", () => {
    let parseStringStub, logErrorStub, infoV2Stub, amendInvolvedParty_CGtoOCIF;

    beforeEach(() => {
        // Stub the methods you want to mock
        parseStringStub = sinon.stub();
        logErrorStub = sinon.stub();
        infoV2Stub = sinon.stub();

        // Use Proxyquire to load the module with the mocked dependencies
        amendInvolvedParty_CGtoOCIF = proxyquire("./mapResponse", {
            "xml2js": {
                Parser: function () {
                    this.parseString = parseStringStub;
                }
            },
            "@bmo-util/framework": {
                logError: logErrorStub,
                infoV2: infoV2Stub
            }
        }).amendInvolvedParty_CGtoOCIF;
    });

    afterEach(() => {
        sinon.restore(); // Clean up after each test
    });

    it("should return success response when statusCode is 200", async () => {
        const response = { statusCode: 200, body: "<xml>data</xml>" };
        const result = await amendInvolvedParty_CGtoOCIF(response);

        expect(result).to.deep.equal({
            statusCode: 200,
            responseObject: {}
        });
    });

    it("should return error response for systemfault", async () => {
        const xmlData = `<Envelope>
            <Body>
                <Fault>
                    <faultcode>systemfault</faultcode>
                    <detail>
                        <systemFault>
                            <faultInfo>
                                <additionalText>Some error occurred</additionalText>
                                <parameter>
                                    <key>TRANSACTION_REFERENCE</key>
                                    <value>12345</value>
                                </parameter>
                            </faultInfo>
                        </systemFault>
                    </detail>
                </Fault>
            </Body>
        </Envelope>`;

        const response = { statusCode: 500, body: xmlData };

        // Simulate the XML parsing with stub
        parseStringStub.yields(null, {
            Envelope: {
                Body: {
                    Fault: {
                        faultcode: "systemfault",
                        detail: {
                            systemFault: {
                                faultInfo: {
                                    additionalText: "Some error occurred",
                                    parameter: [{ key: "TRANSACTION_REFERENCE", value: "12345" }]
                                }
                            }
                        }
                    }
                }
            }
        });

        const result = await amendInvolvedParty_CGtoOCIF(response);

        expect(result).to.have.property("statusCode", 500);
        expect(result.responseObject).to.deep.include({
            type: "failure",
            title: "internal Server error",
            detail: "systemfault: TRANSACTION_REFERENCE: 12345, Some error occurred"
        });
    });

    it("should log and throw error when XML parsing fails", async () => {
        const xmlData = "<invalid_xml>";
        const response = { statusCode: 500, body: xmlData };

        // Simulate a parsing error
        const parseError = new Error("Parse error");
        parseStringStub.yields(parseError, null);

        // Expect the function to log the error and throw it
        await expect(amendInvolvedParty_CGtoOCIF(response)).to.be.rejectedWith("Parse error");
        expect(logErrorStub.calledWith("error parsing XML getInvolvedPartyResponse to JSON", parseError)).to.be.true;
    });
});
