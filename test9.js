const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire");

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

describe("mapRequest.js", function () {
  describe("amendInvolvedParty_OCIFtoCG", function () {
    it("should map the payload correctly", async function () {
      const payload = { originatorData: { country: "US" }, identifier: { id: "12345" } };
      const result = await mapRequest.amendInvolvedParty_OCIFtoCG(payload);
      expect(result).to.be.a("string");
    });
  });

  describe("mapEnvelope", function () {
    it("should map the SOAP envelope", function () {
      const payload = { originatorData: { channel: "Online", appCatId: "App1" } };
      const result = mapRequest.mapEnvelope(payload);
      expect(result).to.have.property("IsEnvelope", true);
      expect(result.envelope).to.have.property("Header");
      expect(result.envelope.Header).to.have.property("bmoHdrRq");
    });
  });

  describe("mapSoapHeader", function () {
    it("should map the SOAP header based on originator data", function () {
      const originatorData = { channel: "Web", appCatId: "App1", country: "CA" };
      const result = mapRequest.mapSoapHeader(originatorData);
      expect(result).to.have.property("IsHeader", true);
      expect(result.header.Header).to.have.property("bmoHdrRq");
    });
  });

  describe("mapSoapBody", function () {
    it("should map the SOAP body including input header and input body", function () {
      const payload = { identifier: { id: "12345" } };
      const result = mapRequest.mapSoapBody(payload);
      expect(result).to.have.property("IsSoapBody", true);
      expect(result.soapBody.Body).to.have.property("AmendInvolvedPartyRequest");
    });
  });

  describe("mapAmendInvolvedPartyInputHeader", function () {
    it("should map the input header correctly", function () {
      const result = mapRequest.mapAmendInvolvedPartyInputHeader();
      expect(result).to.have.property("IsInputHeader", true);
      expect(result.inputHeader.AmendInvolvedPartyInputHeader).to.have.property("BusinessUnitCode", "BB");
    });
  });

  describe("mapInvolvedPartyIdentifier", function () {
    it("should map the involved party identifier", function () {
      const payload = { identifier: { id: "12345" } };
      const result = mapRequest.mapInvolvedPartyIdentifier(payload);
      expect(result).to.deep.equal({
        IsPartyIdentifier: true,
        partyIdentifierObj: { InvolvedPartyIdentifier: "12345" }
      });
    });
  });

  describe("mapAmendIdentification", function () {
    it("should map the identification details correctly", function () {
      const payload = { originatorData: { country: "US" } };
      const result = mapRequest.mapAmendIdentification(payload);
      expect(result).to.have.property("IsAmendIdentification", true);
      expect(result.amendIdentificationObj.AmendIdentification).to.have.property("Identification");
    });
  });

  describe("mapForeignIndiciaList", function () {
    it("should map foreign indicia list using mapperHelper", function () {
      const data = { foreignIndicia: [{ action: "ADD", foreignTaxCountry: "US" }] };
      const result = mapRequest.mapForeignIndiciaList(data);
      expect(result).to.have.property("IsForeignIndiciaList", true);
    });
  });

  describe("mapForeignSupportDocumentList", function () {
    it("should map foreign support document list using mapperHelper", function () {
      const data = { foreignSupportDocument: [{ action: "ADD", documentStatus: "Verified" }] };
      const result = mapRequest.mapForeignSupportDocumentList(data);
      expect(result).to.have.property("IsForeignSupportDocument", true);
    });
  });

  describe("mapForeignTaxEntityObj", function () {
    it("should map foreign tax entity object correctly", function () {
      const data = { foreignTaxEntity: { action: "UPDATE", canadianTaxResident: true } };
      const result = mapRequest.mapForeignTaxEntityObj(data);
      expect(result).to.have.property("IsForeignTaxEntityObj", true);
    });
  });

  describe("mapForeignTaxIndividualObj", function () {
    it("should map foreign tax individual object correctly", function () {
      const data = { foreignTaxIndividual: { action: "DELETE", usCitizen: true } };
      const result = mapRequest.mapForeignTaxIndividualObj(data);
      expect(result).to.have.property("IsForeignTaxIndividual", true);
    });
  });

  describe("mapForeignTaxCountryList", function () {
    it("should map foreign tax country list using mapperHelper", function () {
      const data = { foreignTaxCountry: [{ action: "ADD", foreignTaxStatusType: "Active" }] };
      const result = mapRequest.mapForeignTaxCountryList(data);
      expect(result).to.have.property("IsForeignTaxCountry", true);
    });
  });

  describe("mapForeignTaxRoleList", function () {
    it("should map foreign tax role list correctly", function () {
      const data = { foreignTaxRole: [{ action: "ADD", usCitizen: true }] };
      const result = mapRequest.mapForeignTaxRoleList(data);
      expect(result).to.have.property("IsForeignTaxRole", true);
    });
  });
});
