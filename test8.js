const { expect } = require("chai");
const sinon = require("sinon");
const { amendInvolvedParty_CGtoOCIF } = require("./mapResponse");
const xml2js = require("xml2js");

describe("amendInvolvedParty_CGtoOCIF", () => {
    let parseStringStub;

    beforeEach(() => {
        parseStringStub = sinon.stub(xml2js.Parser.prototype, "parseString");
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should return success response when statusCode is 200", async () => {
        const response = { statusCode: 200, body: "<xml>data</xml>" };
        const result = await amendInvolvedParty_CGtoOCIF(response);
        expect(result).to.deep.equal({ statusCode: 200, responseObject: {} });
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
        parseStringStub.yields(null, {}); // Simulate successful XML parsing

        const result = await amendInvolvedParty_CGtoOCIF(response);
        
        expect(result).to.have.property("statusCode", 500);
        expect(result.responseObject).to.deep.include({
            type: "failure",
            title: "internal Server error",
            detail: "systemfault: TRANSACTION_REFERENCE: 12345, Some error occurred"
        });
    });

    it("should log error and throw when XML parsing fails", async () => {
        const xmlData = "<invalid_xml>";
        const response = { statusCode: 500, body: xmlData };
        
        parseStringStub.yields(new Error("Parse error"), null); // Simulate XML parsing error

        await expect(amendInvolvedParty_CGtoOCIF(response)).to.be.rejectedWith("Parse error");
    });
});
