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

// Helper function _injectNamespace for tests
const _injectNamespace = (template, payload) => {
  let result = {};

  if(!template || !payload) return result;

  for (let [key, value] of Object.entries(template)) {
    let curKey = key.split(":")[1];

    if (Object.keys(payload).includes(curKey)) {
      if (Array.isArray(payload[curKey])) {
        result[key] = [];
        payload[curKey].forEach(elem => {
          result[key].push(_injectNamespace(value[0], elem));
        });
      }
      else if (typeof payload[curKey] === "object") {
        result[key] = _injectNamespace(value[0], payload[curKey]);
      }
      else {
        result[key] = payload[curKey];
      }
    }
  }
  
  return result;
};

describe("mapRequest.js Edge Cases", function () {
  
  describe("amendInvolvedParty_OCIFtoCG", function () {
    it("should return an empty string when payload is missing required properties", async function () {
      const payload = {}; // Empty payload
      const result = await mapRequest.amendInvolvedParty_OCIFtoCG(payload);
      expect(result).to.be.a("string").that.is.empty;
    });
  });

  describe("mapEnvelope", function () {
    it("should return only base structure when payload lacks originatorData", function () {
      const payload = {}; // No originatorData
      const result = mapRequest.mapEnvelope(payload);
      expect(result).to.deep.include({
        IsEnvelope: true,
        envelope: { Header: {} }
      });
    });
  });

  describe("mapSoapHeader", function () {
    it("should return only base structure when originatorData is incomplete", function () {
      const originatorData = { channel: "Web" }; // Missing appCatId and country
      const result = mapRequest.mapSoapHeader(originatorData);
      expect(result.header.Header).to.have.property("bmoHdrRq").that.is.an("object");
      expect(result.header.Header.bmoHdrRq).to.not.have.any.keys("country", "appCatId");
    });
  });

  describe("mapSoapBody Edge Cases", function () {
    it("should return IsSoapBody without AmendInvolvedPartyRequest when identifier is missing", function () {
      const payload = {}; // Missing identifier
      const result = mapRequest.mapSoapBody(payload);
      expect(result).to.have.property("IsSoapBody", true);
      expect(result.soapBody.Body).to.not.have.property("AmendInvolvedPartyRequest");
    });
  });

  describe("mapInvolvedPartyIdentifier", function () {
    it("should return empty object when identifier is missing", function () {
      const payload = {}; // Missing identifier
      const result = mapRequest.mapInvolvedPartyIdentifier(payload);
      expect(result).to.deep.equal({
        IsPartyIdentifier: true,
        partyIdentifierObj: {}
      });
    });
  });

  describe("mapForeignIndiciaList Edge Cases", function () {
    it("should handle empty foreignIndicia array gracefully", function () {
      const data = { foreignIndicia: [] }; // Empty array
      const result = mapRequest.mapForeignIndiciaList(data);
      expect(result.foreignIndiciaData).to.have.property("AmendForeignIndicia").that.is.an("array").with.lengthOf(0);
    });

    it("should handle foreignIndicia objects with missing properties", function () {
      const data = { foreignIndicia: [{ action: "ADD" }] }; // Missing detailed properties
      const result = mapRequest.mapForeignIndiciaList(data);
      const mappedIndicia = result.foreignIndiciaData.AmendForeignIndicia[0];
      expect(mappedIndicia).to.have.property("Action", "ADD");
      expect(mappedIndicia.ForeignIndicia).to.not.have.keys("TransitNumber", "ForeignTaxCountry");
    });
  });

  describe("mapForeignTaxTrustList Edge Cases", function () {
    it("should handle missing optional properties in foreignTaxTrust objects", function () {
      const data = {
        foreignTaxTrust: [
          {
            action: "UPDATE",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "user2" }] }],
            // Missing lastMaintainedDate, owningSldp, and other fields
          }
        ]
      };
      const result = mapRequest.mapForeignTaxTrustList(data);
      const trustDetails = result.foreignTaxTrustData.AmendForeignTaxTrust[0].ForeignTaxTrust;
      expect(trustDetails).to.have.property("ObjectIdentifier");
      expect(trustDetails).to.not.have.property("lastMaintainedDate");
      expect(trustDetails).to.not.have.property("OwningSLDP");
    });

    it("should handle empty foreignTaxTrust array", function () {
      const data = { foreignTaxTrust: [] };
      const result = mapRequest.mapForeignTaxTrustList(data);
      expect(result.foreignTaxTrustData.AmendForeignTaxTrust).to.be.an("array").that.is.empty;
    });
  });

  describe("mapAmendIdentification Edge Cases", function () {
    it("should include default IdentificationText when payload has no identification data", function () {
      const payload = {}; // No identification data
      const result = mapRequest.mapAmendIdentification(payload);
      expect(result.amendIdentificationObj.AmendIdentification.Identification).to.have.property("IdentificationText", "381282912");
    });

    it("should exclude IdentificationIssuingCountry if country is missing", function () {
      const payload = {}; // No country provided
      const result = mapRequest.mapAmendIdentification(payload);
      expect(result.amendIdentificationObj.AmendIdentification.Identification).to.not.have.property("IdentificationIssuingCountry");
    });
  });
});
