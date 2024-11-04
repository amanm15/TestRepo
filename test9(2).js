const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire");
const xml2js = require("xml2js");

// Stubbing external dependencies
const infoV2Stub = sinon.stub();
const logErrorStub = sinon.stub();
const getCorrelationIdStub = sinon.stub().returns("mockCorrelationId");

// Importing mapRequest with stubs
const mapRequest = proxyquire("../service/subService/amendInvolvedParty/mapRequest", {
  "@bmo-util/framework": {
    infoV2: infoV2Stub,
    logError: logErrorStub,
    getCorrelationId: getCorrelationIdStub
  }
});

describe("mapRequest.js Additional Branch Coverage", function () {

  describe("mapForeignIndiciaList Branch Coverage", function () {
    it("should handle foreignIndicia with missing sourceObjectRef", function () {
      const data = {
        foreignIndicia: [
          {
            action: "ADD",
            // sourceObjectRef is missing
            foreignTaxCountry: "US",
          }
        ]
      };
      const result = mapRequest.mapForeignIndiciaList(data);
      const mappedIndicia = result.foreignIndiciaData.AmendForeignIndicia[0];
      expect(mappedIndicia.ForeignIndicia).to.not.have.property("RecordAudit");
    });

    it("should handle foreignIndicia with non-array sourceObjectRef", function () {
      const data = {
        foreignIndicia: [
          {
            action: "ADD",
            sourceObjectRef: "not-an-array",
            foreignTaxCountry: "US",
          }
        ]
      };
      const result = mapRequest.mapForeignIndiciaList(data);
      const mappedIndicia = result.foreignIndiciaData.AmendForeignIndicia[0];
      expect(mappedIndicia.ForeignIndicia).to.not.have.property("RecordAudit");
    });
  });

  describe("_injectNamespace Additional Coverage", function () {
    it("should handle payload with non-array values when template expects array", function () {
      const template = { "ns:Parent": [{ "ns:Child": {} }] };
      const payload = { Parent: "non-array" }; // Non-array value where array is expected

      const result = mapRequest._injectNamespace(template, payload);
      expect(result).to.deep.equal({
        "ns:Parent": []
      });
    });

    it("should handle empty nested objects in payload without errors", function () {
      const template = { "ns:Parent": { "ns:Child": { "ns:Grandchild": {} } } };
      const payload = { Parent: { Child: {} } }; // Grandchild is missing

      const result = mapRequest._injectNamespace(template, payload);
      expect(result).to.deep.equal({
        "ns:Parent": {}
      });
    });
  });

  describe("mapForeignTaxTrustList Branch Coverage", function () {
    it("should handle foreignTaxTrust with missing action field", function () {
      const data = {
        foreignTaxTrust: [
          {
            // Missing action field
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "user1", refKeyValue: "identifier1" }] }],
            trustAccountNumber: "TRUST-123"
          }
        ]
      };
      const result = mapRequest.mapForeignTaxTrustList(data);
      const trustDetails = result.foreignTaxTrustData.AmendForeignTaxTrust[0].ForeignTaxTrust;

      expect(trustDetails).to.have.property("ObjectIdentifier", "identifier1");
      expect(trustDetails).to.have.property("TrustAccountNumber", "TRUST-123");
    });

    it("should handle foreignTaxTrust with empty sourceObjectRef array", function () {
      const data = {
        foreignTaxTrust: [
          {
            action: "ADD",
            sourceObjectRef: [], // Empty array
            trustAccountNumber: "TRUST-123"
          }
        ]
      };
      const result = mapRequest.mapForeignTaxTrustList(data);
      const trustDetails = result.foreignTaxTrustData.AmendForeignTaxTrust[0].ForeignTaxTrust;

      expect(trustDetails).to.not.have.property("ObjectIdentifier");
      expect(trustDetails).to.have.property("TrustAccountNumber", "TRUST-123");
    });
  });

  describe("mapAmendIdentification Branch Coverage", function () {
    it("should include IdentificationTypeCode by default and handle empty payload gracefully", function () {
      const payload = {}; // Empty payload
      const result = mapRequest.mapAmendIdentification(payload);

      expect(result.amendIdentificationObj.AmendIdentification.Identification).to.have.property("IdentificationTypeCode").that.deep.equals({ Code: "SI" });
    });

    it("should include country in IdentificationIssuingCountry if provided", function () {
      const payload = { originatorData: { country: "CA" } };
      const result = mapRequest.mapAmendIdentification(payload);

      expect(result.amendIdentificationObj.AmendIdentification.Identification).to.have.property("IdentificationIssuingCountry", "CA");
    });
  });
  
});
