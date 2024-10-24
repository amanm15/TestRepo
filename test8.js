const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire");

describe("mapResponse", () => {
    let mapResponse;
    let logErrorStub;
    let parserStub;

    beforeEach(() => {
        logErrorStub = sinon.stub();
        parserStub = {
            parseString: sinon.stub(),
        };

        // Use proxyquire to replace the actual logError and xml2js
        mapResponse = proxyquire("../path/to/mapResponse", {
            "@bmo-util/framework": {
                logError: logErrorStub,
            },
            "xml2js": {
                Parser: sinon.stub().returns(parserStub),
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should return response object when statusCode is 200", async () => {
        const response = { statusCode: 200, body: "<xml>data</xml>" };

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(response);
        expect(result).to.deep.equal({
            statusCode: 200,
            responseObject: {},
        });
    });

    it("should log and throw error when XML parsing fails", async () => {
        const response = { statusCode: 500, body: "<xml>data</xml>" };
        const error = new Error("Parsing error");
        parserStub.parseString.yields(error); // Simulate parsing error

        await expect(mapResponse.amendInvolvedParty_CGtoOCIF(response)).to.be.rejectedWith(error);

        expect(logErrorStub.calledOnce).to.be.true;
        expect(logErrorStub.calledWith("error parsing XML getInvolvedPartyResponse to JSON", error)).to.be.true;
    });

    it("should handle error response correctly", async () => {
        const response = { statusCode: 500, body: "<xml><Envelope><Body><Fault><faultcode>systemfault</faultcode><detail><systemFault><faultInfo><additionalText>Error occurred</additionalText></faultInfo></systemFault></detail></Fault></Body></Envelope></xml>" };
        parserStub.parseString.yields(null, response.body); // Simulate successful parsing

        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(response);

        expect(result).to.deep.include({
            statusCode: 500,
            responseObject: {
                type: "failure",
                title: "internal Server error",
                status: 500,
                detail: "systemfault: TRANSACTION_REFERENCE: no TRANSACTION_REFERENCE found, Error occurred",
            },
        });
    });
});
