const { expect } = require("chai");
const sinon = require("sinon");
const {
  amendInvolvedParty_OCIFtoCG,
  mapEnvelope,
  mapSoapHeader,
  mapSoapBody,
  mapAmendInvolvedPartyInputHeader,
  mapInvolvedPartyIdentifier,
  mapAmendInvolvedPartyInputBody,
  mapAmendIdentification,
  mapForeignIndiciaList,
  mapForeignSupportDocumentList,
  mapForeignTaxEntityObj,
  mapForeignTaxIndividualObj,
  mapForeignTaxCountryList,
  mapForeignTaxRoleList
} = require("./updateEtchDatamapRequest"); // Replace with actual path
const js2xmlparser = require("js2xmlparser");

describe("updateEtchDatamapRequest.js", function () {
  afterEach(function () {
    sinon.restore();
  });

  describe("mapInvolvedPartyIdentifier", function () {
    it("should map InvolvedPartyIdentifier correctly", function () {
      const payload = { identifier: { id: "12345" } };
      const result = mapInvolvedPartyIdentifier(payload);

      expect(result).to.have.property("IsPartyIdentifier", true);
      expect(result.partyIdentifierObj).to.deep.include({
        InvolvedPartyIdentifier: "12345"
      });
    });
  });

  describe("mapAmendInvolvedPartyInputBody", function () {
    it("should map the input body with valid fields", function () {
      const payload = { /* sample payload with identifiers and roles */ };
      const result = mapAmendInvolvedPartyInputBody(payload);

      expect(result).to.have.property("IsInputBody", true);
      expect(result.inputBody).to.have.property("AmendInvolvedPartyInputBody");
    });
  });

  describe("mapAmendIdentification", function () {
    it("should map AmendIdentification correctly", function () {
      const payload = { originatorData: { country: "CA" } };
      const result = mapAmendIdentification(payload);

      expect(result).to.have.property("IsAmendIdentification", false);
      expect(result.amendIdentificationObj.Identification).to.deep.include({
        IdentificationIssuingCountry: "CA"
      });
    });
  });

  describe("mapForeignIndiciaList", function () {
    it("should return false when foreignIndicia is empty", function () {
      const data = { foreignIndicia: [] };
      const result = mapForeignIndiciaList(data);

      expect(result).to.have.property("IsForeignIndiciaList", false);
      expect(result.foreignIndiciaData).to.be.empty;
    });

    it("should return mapped foreignIndicia list when data is provided", function () {
      const data = {
        foreignIndicia: [
          {
            action: "ADD",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "User1" }] }],
            lastMaintainedDate: "2024-09-04T00:00:00Z",
          },
        ],
      };
      const result = mapForeignIndiciaList(data);

      expect(result).to.have.property("IsForeignIndiciaList", true);
      expect(result.foreignIndiciaData.AmendForeignIndicia[0]).to.deep.include({
        Action: "ADD",
        ForeignIndicia: {
          LastMaintainedDate: "2024-09-04T00:00:00Z",
        },
      });
    });
  });

  describe("mapForeignSupportDocumentList", function () {
    it("should return false when foreignSupportDocument is empty", function () {
      const data = { foreignSupportDocument: [] };
      const result = mapForeignSupportDocumentList(data);

      expect(result).to.have.property("IsForeignSupportDocument", false);
      expect(result.foreignSupportDocumentData).to.be.empty;
    });

    it("should return mapped foreignSupportDocument list when data is provided", function () {
      const data = {
        foreignSupportDocument: [
          {
            action: "ADD",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "User1" }] }],
            lastMaintainedDate: "2024-09-04T00:00:00Z",
          },
        ],
      };
      const result = mapForeignSupportDocumentList(data);

      expect(result).to.have.property("IsForeignSupportDocument", true);
      expect(result.foreignSupportDocumentData.AmendForeignSupportDocuments[0]).to.deep.include({
        Action: "ADD",
        ForeignSupportDocument: {
          LastMaintainedDate: "2024-09-04T00:00:00Z",
        },
      });
    });
  });

  describe("mapForeignTaxEntityObj", function () {
    it("should return false when foreignTaxEntity is empty", function () {
      const data = { foreignTaxEntity: {} };
      const result = mapForeignTaxEntityObj(data);

      expect(result).to.have.property("IsForeignTaxEntityObj", false);
      expect(result.foreignTaxEntityData).to.be.empty;
    });

    it("should map foreignTaxEntity object correctly", function () {
      const data = {
        foreignTaxEntity: {
          action: "ADD",
          sourceObjectRef: [{ objectRef: [{ refKeyUser: "User1" }] }],
          lastMaintainedDate: "2024-09-04T00:00:00Z",
        },
      };
      const result = mapForeignTaxEntityObj(data);

      expect(result).to.have.property("IsForeignTaxEntityObj", true);
      expect(result.foreignTaxEntityData.AmendForeignTaxEntity.ForeignTaxEntity).to.deep.include({
        LastMaintainedDate: "2024-09-04T00:00:00Z",
      });
    });
  });

  describe("mapForeignTaxIndividualObj", function () {
    it("should return false when foreignTaxIndividual is empty", function () {
      const data = { foreignTaxIndividual: {} };
      const result = mapForeignTaxIndividualObj(data);

      expect(result).to.have.property("IsForeignTaxIndividual", false);
      expect(result.foreignTaxIndividualData).to.be.empty;
    });

    it("should map foreignTaxIndividual object correctly", function () {
      const data = {
        foreignTaxIndividual: {
          sourceObjectRef: [{ objectRef: [{ refKeyUser: "User1" }] }],
          lastMaintainedDate: "2024-09-04T00:00:00Z",
        },
      };
      const result = mapForeignTaxIndividualObj(data);

      expect(result).to.have.property("IsForeignTaxIndividual", true);
      expect(result.foreignTaxIndividualData.AmendForeignTaxIndividual.ForeignTaxIndividual).to.deep.include({
        LastMaintainedDate: "2024-09-04T00:00:00Z",
      });
    });
  });

  describe("mapForeignTaxCountryList", function () {
    it("should return false when foreignTaxCountry is empty", function () {
      const data = { foreignTaxCountry: [] };
      const result = mapForeignTaxCountryList(data);

      expect(result).to.have.property("IsForeignTaxCountry", false);
      expect(result.foreignTaxCountryData).to.be.empty;
    });

    it("should return mapped foreignTaxCountry list when data is provided", function () {
      const data = {
        foreignTaxCountry: [
          {
            action: "ADD",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "User1" }] }],
            lastMaintainedDate: "2024-09-04T00:00:00Z",
          },
        ],
      };
      const result = mapForeignTaxCountryList(data);

      expect(result).to.have.property("IsForeignTaxCountry", true);
      expect(result.foreignTaxCountryData.AmendForeignTaxCountry[0]).to.deep.include({
        Action: "ADD",
        ForeignTaxCountry: {
          LastMaintainedDate: "2024-09-04T00:00:00Z",
        },
      });
    });
  });

  describe("mapForeignTaxRoleList", function () {
    it("should return false when foreignTaxRole is empty", function () {
      const data = { foreignTaxRole: [] };
      const result = mapForeignTaxRoleList(data);

      expect(result).to.have.property("IsForeignTaxRole", false);
      expect(result.foreignTaxRoleData).to.be.empty;
    });

    it("should return mapped foreignTaxRole list when data is provided", function () {
      const data = {
        foreignTaxRole: [
          {
            action: "ADD",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "User1" }] }],
            lastMaintainedDate: "2024-09-04T00:00:00Z",
          },
        ],
      };
      const result = mapForeignTaxRoleList(data);

      expect(result).to.have.property("IsForeignTaxRole", true);
      expect(result.foreignTaxRoleData.AmendForeignTaxRole[0]).to.deep.include({
        Action: "ADD",
        ForeignTaxRole: {
          LastMaintainedDate: "2024-09-04T00:00:00Z",
        },
      });
    });
  });
});
