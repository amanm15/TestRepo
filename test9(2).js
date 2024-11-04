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

describe("mapRequest.js Error Handling and Branch Coverage", function () {

  describe("mapForeignIndiciaList Error Handling", function () {
    it("should handle errors and call logError when processing foreignIndicia fails", function () {
      // Simulate data that will throw an error during processing
      const data = {
        foreignIndicia: "invalid-data" // Invalid format to trigger an error
      };
      
      try {
        mapRequest.mapForeignIndiciaList(data);
      } catch (error) {
        expect(logErrorStub.calledOnce).to.be.true;
        expect(logErrorStub.firstCall.args[0]).to.include("Error processing foreignIndicia");
      }
    });
  });

  describe("injectPayloadNamespace Error Handling", function () {
    it("should call logError if an error occurs during XML parsing", async function () {
      const templateFilename = "testTemplate.xml";
      const payload = { sampleKey: "sampleValue" };

      sinon.stub(xml2js, "parseStringPromise").rejects(new Error("Parsing Error"));

      try {
        await mapRequest.injectPayloadNamespace(templateFilename, payload);
      } catch (error) {
        expect(logErrorStub.calledOnce).to.be.true;
        expect(logErrorStub.firstCall.args[0]).to.include("Error parsing XML template");
        expect(error.message).to.equal("Parsing Error");
      }

      xml2js.parseStringPromise.restore();
    });

    it("should handle missing payload and template gracefully without throwing", async function () {
      const result = await mapRequest.injectPayloadNamespace(null, null);
      expect(result).to.be.empty;
    });
  });

  describe("_injectNamespace Branch Coverage", function () {
    it("should handle undefined template or payload gracefully", function () {
      const result = mapRequest._injectNamespace(undefined, undefined);
      expect(result).to.deep.equal({});
    });

    it("should handle null values in payload properties", function () {
      const template = { "ns:Parent": { "ns:Child": { "ns:Grandchild": {} } } };
      const payload = { Parent: { Child: { Grandchild: null } } };

      const result = mapRequest._injectNamespace(template, payload);
      expect(result).to.deep.equal({
        "ns:Parent": {}
      });
    });
  });

  describe("mapForeignTaxTrustList Error Handling and Edge Cases", function () {
    it("should handle errors and call logError if sourceObjectRef is not an array", function () {
      const data = {
        foreignTaxTrust: [
          {
            action: "ADD",
            sourceObjectRef: "not-an-array", // Invalid sourceObjectRef to trigger error
          }
        ]
      };

      try {
        mapRequest.mapForeignTaxTrustList(data);
      } catch (error) {
        expect(logErrorStub.calledOnce).to.be.true;
        expect(logErrorStub.firstCall.args[0]).to.include("Invalid sourceObjectRef format in foreignTaxTrust");
        expect(error.message).to.include("sourceObjectRef must be an array");
      }
    });

    it("should handle empty foreignTaxTrust array gracefully", function () {
      const data = { foreignTaxTrust: [] }; // Empty array
      const result = mapRequest.mapForeignTaxTrustList(data);
      expect(result.foreignTaxTrustData.AmendForeignTaxTrust).to.be.an("array").that.is.empty;
    });

    it("should handle missing sourceObjectRef property gracefully without error", function () {
      const data = {
        foreignTaxTrust: [
          {
            action: "ADD",
            trustAccountNumber: "TRUST-123"
          }
        ]
      };

      const result = mapRequest.mapForeignTaxTrustList(data);
      const trustDetails = result.foreignTaxTrustData.AmendForeignTaxTrust[0].ForeignTaxTrust;
      expect(trustDetails).to.have.property("TrustAccountNumber", "TRUST-123");
      expect(trustDetails).to.not.have.property("ObjectIdentifier"); // sourceObjectRef missing
    });
  });

  describe("mapAmendIdentification Conditional Branch Coverage", function () {
    it("should handle payload with missing IdentificationIssuingCountry", function () {
      const payload = {}; // No country provided in payload
      const result = mapRequest.mapAmendIdentification(payload);

      expect(result.amendIdentificationObj.AmendIdentification.Identification).to.not.have.property("IdentificationIssuingCountry");
    });

    it("should handle payload with non-string country gracefully", function () {
      const payload = { originatorData: { country: 12345 } }; // Invalid country type
      const result = mapRequest.mapAmendIdentification(payload);

      expect(result.amendIdentificationObj.AmendIdentification.Identification).to.have.property("IdentificationIssuingCountry", 12345);
    });
  });

  describe("validateObjBasedOnAction Error Handling", function () {
    it("should throw an error if sourceObjectRef is not an array in UPDATE action", function () {
      const currentObj = { sourceObjectRef: "not-an-array" };
      expect(() => mapRequest.validateObjBasedOnAction("UPDATE", currentObj, "foreignTaxTrust", 0))
        .to.throw()
        .that.includes({ status: 400, detail: 'object has missing required properties (["id"])' });
    });

    it("should handle missing sourceObjectRef without throwing for ADD action", function () {
      const currentObj = {};
      const result = mapRequest.validateObjBasedOnAction("ADD", currentObj, "foreignTaxTrust", 0);
      expect(result).to.deep.equal({
        IsRecordAudit: false,
        IsLastMaintainedUser: false
      });
    });

    it("should throw an error if sourceObjectRef is undefined for non-ADD actions", function () {
      const currentObj = {};
      expect(() => mapRequest.validateObjBasedOnAction("UPDATE", currentObj, "foreignTaxTrust", 0))
        .to.throw()
        .that.includes({ status: 400, detail: "sourceObjectRef must be defined in foreignTaxTrust for UPDATE Action at index 0" });
    });

    it("should throw an error if sourceObjectRef is an empty array for non-ADD actions", function () {
      const currentObj = { sourceObjectRef: [] };
      expect(() => mapRequest.validateObjBasedOnAction("DELETE", currentObj, "foreignTaxTrust", 1))
        .to.throw()
        .that.includes({ status: 400, detail: "sourceObjectRef in foreignTaxTrust for DELETE Action at index 1 MUST not be empty" });
    });
  });
});
