const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire");
const xml2js = require("xml2js");

// Stubbing external dependencies
const infoV2Stub = sinon.stub();
const logErrorStub = sinon.stub();
const getCorrelationIdStub = sinon.stub().returns("mockCorrelationId");
const validateObjBasedOnActionStub = sinon.stub();

// Importing mapRequest with stubs
const mapRequest = proxyquire("../service/subService/amendInvolvedParty/mapRequest", {
  "@bmo-util/framework": {
    infoV2: infoV2Stub,
    logError: logErrorStub,
    getCorrelationId: getCorrelationIdStub
  }
});

// Testing validateObjBasedOnAction
describe("validateObjBasedOnAction", function () {
    it("should return false flags when Action is 'ADD'", function () {
        const result = mapRequest.validateObjBasedOnAction("ADD", {}, "TestObject");
        expect(result).to.deep.equal({
            IsRecordAudit: false,
            IsLastMaintainedUser: false
        });
    });

    it("should return true flags when Action is 'UPDATE'", function () {
        const result = mapRequest.validateObjBasedOnAction("UPDATE", { sourceObjectRef: [] }, "TestObject");
        expect(result).to.deep.equal({
            IsRecordAudit: true,
            IsLastMaintainedUser: true
        });
    });

    it("should throw an error when sourceObjectRef is undefined", function () {
        const invalidObj = {}; // No sourceObjectRef
        expect(() => mapRequest.validateObjBasedOnAction("UPDATE", invalidObj, "TestObject"))
            .to.throw()
            .that.deep.includes({
                type: "failure",
                title: "Invalid request body",
                status: 400,
                detail: `sourceObjectRef must be defined in TestObject for UPDATE Action at index 1`
            });
    });

    it("should throw an error when sourceObjectRef is empty array", function () {
        const invalidObj = { sourceObjectRef: [] }; // Empty array
        expect(() => mapRequest.validateObjBasedOnAction("UPDATE", invalidObj, "TestObject"))
            .to.throw()
            .that.deep.includes({
                type: "failure",
                title: "Invalid request body",
                status: 400,
                detail: `sourceObjectRef in TestObject for UPDATE Action at index 1 MUST not be empty`
            });
    });
});

// Testing _injectNamespace
describe("_injectNamespace", function () {
    const _injectNamespace = mapRequest._injectNamespace;  // Assuming it's accessible

    it("should handle array values in payload and namespace each array element", function () {
        const template = { "ns:Items": [{ "ns:Item": { "ns:Name": {} } }] };
        const payload = { Items: [{ Name: "Item1" }, { Name: "Item2" }] };
        const result = _injectNamespace(template, payload);

        expect(result).to.deep.equal({
            "ns:Items": [
                { "ns:Item": { "ns:Name": "Item1" } },
                { "ns:Item": { "ns:Name": "Item2" } }
            ]
        });
    });

    it("should handle missing properties in payload gracefully", function () {
        const template = { "ns:Parent": { "ns:Child": { "ns:Grandchild": {} } } };
        const payload = {};  // No matching structure
        const result = _injectNamespace(template, payload);
        expect(result).to.deep.equal({ "ns:Parent": {} });
    });

    it("should handle mixed values including arrays and objects in payload", function () {
        const template = { "ns:Parent": { "ns:Child": [{ "ns:SubChild": { "ns:Value": {} } }] } };
        const payload = { Parent: { Child: [{ SubChild: { Value: "Test" } }, { SubChild: { Value: "Test2" } }] } };
        const result = _injectNamespace(template, payload);

        expect(result).to.deep.equal({
            "ns:Parent": { "ns:Child": [
                { "ns:SubChild": { "ns:Value": "Test" } },
                { "ns:SubChild": { "ns:Value": "Test2" } }
            ]}
        });
    });
});

// Testing mapAmendIdentification
describe("mapAmendIdentification", function () {
    it("should return amendIdentificationObj without IdentificationIssuingCountry when country is absent", function () {
        const payload = {}; // No country in payload
        const result = mapRequest.mapAmendIdentification(payload);

        expect(result).to.deep.equal({
            IsAmendIdentification: false,
            amendIdentificationObj: {
                AmendIdentification: {
                    Identification: {
                        IdentificationTypeCode: { Code: "SI" },
                        IdentificationText: "381282912",
                        UseAuthorizationCode: "T",
                        LastViewedDate: "2024-09-04",
                        EnteredDate: new Date().toISOString().split("T")[0]
                    }
                }
            }
        });
    });

    it("should include IdentificationIssuingCountry when country is provided in payload", function () {
        const payload = { originatorData: { country: "US" } };
        const result = mapRequest.mapAmendIdentification(payload);

        expect(result.amendIdentificationObj.AmendIdentification.Identification).to.have.property("IdentificationIssuingCountry", "US");
    });

    it("should correctly set EnteredDate to today's date", function () {
        const payload = {}; // Payload without country
        const result = mapRequest.mapAmendIdentification(payload);

        const today = new Date().toISOString().split("T")[0];
        expect(result.amendIdentificationObj.AmendIdentification.Identification.EnteredDate).to.equal(today);
    });
});

// Testing mapForeignTaxTrustList with different branches
describe("mapForeignTaxTrustList", function () {
    let data;

    beforeEach(() => {
        data = {
            foreignTaxTrust: [
                {
                    action: "ADD",
                    sourceObjectRef: [{ objectRef: [{ refKeyUser: "user1", refKeyValue: "identifier1" }] }],
                    owningSldp: "SomeSLDP",
                    trustAccountNumber: "TRUST-123",
                    indiciaCheckComplete: true
                }
            ]
        };
    });

    it("should handle complete foreignTaxTrust list with all fields present", function () {
        const result = mapRequest.mapForeignTaxTrustList(data);
        const trustDetails = result.foreignTaxTrustData.AmendForeignTaxTrust[0].ForeignTaxTrust;

        expect(trustDetails).to.have.property("OwningSLDP", "SomeSLDP");
        expect(trustDetails).to.have.property("TrustAccountNumber", "TRUST-123");
        expect(trustDetails).to.have.property("IndiciaCheckComplete", true);
    });

    it("should handle missing optional properties gracefully", function () {
        data.foreignTaxTrust[0] = { action: "REMOVE" }; // Only `action` is present
        const result = mapRequest.mapForeignTaxTrustList(data);
        const trustDetails = result.foreignTaxTrustData.AmendForeignTaxTrust[0].ForeignTaxTrust;

        expect(trustDetails).to.not.have.property("OwningSLDP");
        expect(trustDetails).to.not.have.property("TrustAccountNumber");
        expect(trustDetails).to.not.have.property("IndiciaCheckComplete");
    });

    it("should handle multiple records with varying fields", function () {
        data.foreignTaxTrust.push({
            action: "UPDATE",
            trustAccountNumber: "TRUST-456",
            indiciaCheckComplete: false
        });

        const result = mapRequest.mapForeignTaxTrustList(data);
        expect(result.foreignTaxTrustData.AmendForeignTaxTrust).to.have.lengthOf(2);

        const firstTrust = result.foreignTaxTrustData.AmendForeignTaxTrust[0].ForeignTaxTrust;
        const secondTrust = result.foreignTaxTrustData.AmendForeignTaxTrust[1].ForeignTaxTrust;

        expect(firstTrust).to.have.property("TrustAccountNumber", "TRUST-123");
        expect(secondTrust).to.have.property("TrustAccountNumber", "TRUST-456");
        expect(secondTrust).to.have.property("IndiciaCheckComplete", false);
    });
});
