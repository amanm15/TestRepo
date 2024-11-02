const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire");

describe("mapResponse", () => {
    let mapResponse;
    let logErrorStub;
    let xml2jsStub;
    let xml2jsProcessorsStub;

    beforeEach(() => {
        logErrorStub = sinon.stub();
        xml2jsStub = {
            Parser: sinon.stub().returns({
                parseString: sinon.stub().yields(null, {
                    Envelope: {
                        Body: {
                            Fault: { faultcode: "fault:systemFault" }
                        }
                    }
                })
            })
        };

        xml2jsProcessorsStub = { stripPrefix: sinon.stub() };

        mapResponse = proxyquire("../service/subService/amendInvolvedParty/mapResponse", {
            "@bmo-util/framework": { logError: logErrorStub, infoV2: sinon.stub() },
            xml2js: xml2jsStub,
            "xml2js-processors": xml2jsProcessorsStub
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    // it("should return a default error response when faultcode is undefined", async () => {
    //     xml2jsStub.Parser().parseString = (xml, callback) => {
    //         callback(null, { Envelope: { Body: { Fault: {} } } }); // No faultcode
    //     };

    //     const mockResponse = { statusCode: 500, body: "<xml>sample</xml>" };
    //     const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

    //     expect(result.statusCode).to.equal(500);
    //     expect(result.responseObject.title).to.equal("MidTier AmendOCIFInvolved Service Failure");
    //     expect(result.responseObject.detail).to.equal("MidTier AmendOCIFInvolved Service Failure");
    // });

    it("should return a formatted error response for a valid system fault", async () => {
        xml2jsStub.Parser().parseString = (xml, callback) => {
            callback(null, {
                Envelope: {
                    Body: {
                        Fault: {
                            faultcode: "fault:systemFault",
                            detail: {
                                systemFault: {
                                    faultInfo: {
                                        additionaltext: "An error occurred",
                                        parameter: [
                                            { key: "TRANSACTION_REFERENCE", value: "12345" }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            });
        };

        const mockResponse = { statusCode: 500, body: "<xml>sample</xml>" };
        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(500);
        expect(result.responseObject.detail).to.include("TRANSACTION_REFERENCE: 12345");
        //expect(result.responseObject.detail).to.include("An error occurred");
    });

    it("should return empty response object when statusCode is 200", async () => {
        const mockResponse = { statusCode: 200, body: "<xml>sample</xml>" };
        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(200);
        expect(result.responseObject).to.deep.equal({});
    });

    it("should log error and throw when XML parsing fails", async () => {
        xml2jsStub.Parser().parseString = (xml, callback) => {
            callback(new Error("Parsing Error"), null); // Simulate parsing error
        };

        const mockResponse = { statusCode: 500, body: "<xml>sample</xml>" };

        try {
            await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);
        } catch (error) {
            // Ensure logError was called
            expect(logErrorStub.calledOnce).to.be.true;

            // Check if logErrorStub was called as expected
            if (logErrorStub.calledOnce) {
                expect(logErrorStub.firstCall.args[0]).to.equal("err parse XML get InvolvedPartyResponse to JSON");
                expect(logErrorStub.firstCall.args[1]).to.be.instanceOf(Error);
                expect(logErrorStub.firstCall.args[1].message).to.equal("Parsing Error");
            }

            // Confirm the caught error is as expected
            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.equal("Parsing Error");
        }
    });

    it("should return a formatted error response for a data validation fault", async () => {
        xml2jsStub.Parser().parseString = (xml, callback) => {
            callback(null, {
                Envelope: {
                    Body: {
                        Fault: {
                            faultcode: "fault:datavalidationfault",
                            detail: {
                                datavalidationFault: {
                                    faultInfo: {
                                        parameter: [
                                            { key: "TRANSACTION_REFERENCE", value: "54321" }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            });
        };

        const mockResponse = { statusCode: 400, body: "<xml>sample</xml>" };
        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(400);
        //expect(result.responseObject.detail).to.include("TRANSACTION_REFERENCE: 54321");
    });

    it("should return a formatted error response for a data access fault", async () => {
        xml2jsStub.Parser().parseString = (xml, callback) => {
            callback(null, {
                Envelope: {
                    Body: {
                        Fault: {
                            faultcode: "fault:dataaccessfault",
                            detail: {
                                dataAccessFault: {
                                    faultInfo: {
                                        parameter: [
                                            { key: "TRANSACTION_REFERENCE", value: "67890" }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            });
        };

        const mockResponse = { statusCode: 403, body: "<xml>sample</xml>" };
        const result = await mapResponse.amendInvolvedParty_CGtoOCIF(mockResponse);

        expect(result.statusCode).to.equal(403);
        expect(result.responseObject.detail).to.include("TRANSACTION_REFERENCE: 67890");
    });
});
