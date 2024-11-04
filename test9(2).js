const { expect } = require("chai");
const sinon = require("sinon");
const mapRequest = require("../path/to/mapRequest");  // Adjust path as necessary

describe("Comprehensive Coverage Tests for mapRequest Functions", function () {

  describe("mapForeignIndiciaList", function () {
    it("should handle empty foreignIndicia array", function () {
      const data = { foreignIndicia: [] };
      const result = mapRequest.mapForeignIndiciaList(data);
      expect(result.foreignIndiciaData.AmendForeignIndicia).to.have.lengthOf(0);
    });

    it("should handle foreignIndicia with only required properties", function () {
      const data = { foreignIndicia: [{ action: "ADD" }] };
      const result = mapRequest.mapForeignIndiciaList(data);
      const indiciaDetails = result.foreignIndiciaData.AmendForeignIndicia[0].ForeignIndicia;
      expect(indiciaDetails).to.not.have.property("RecordAudit");
    });

    it("should handle multiple foreignIndicia items with various properties", function () {
      const data = {
        foreignIndicia: [
          { action: "ADD", foreignTaxCountry: "US", transitNumber: "12345" },
          { action: "UPDATE", lastMaintainedDate: "2024-11-02T10:20:30Z", informationCollectorId: "CollectorID" }
        ]
      };
      const result = mapRequest.mapForeignIndiciaList(data);
      expect(result.foreignIndiciaData.AmendForeignIndicia).to.have.lengthOf(2);
    });
  });

  describe("mapForeignSupportDocumentList", function () {
    it("should handle empty foreignSupportDocument array", function () {
      const data = { foreignSupportDocument: [] };
      const result = mapRequest.mapForeignSupportDocumentList(data);
      expect(result.foreignSupportDocumentData.AmendForeignSupportDocuments).to.have.lengthOf(0);
    });

    it("should handle foreignSupportDocument without RecordAudit", function () {
      const data = { foreignSupportDocument: [{ action: "ADD", documentStatus: "Verified" }] };
      const result = mapRequest.mapForeignSupportDocumentList(data);
      const documentDetails = result.foreignSupportDocumentData.AmendForeignSupportDocuments[0].SupportDocument;
      expect(documentDetails).to.have.property("DocumentStatus", "Verified");
      expect(documentDetails).to.not.have.property("RecordAudit");
    });

    it("should handle invalid foreignSupportDocument data gracefully", function () {
      const data = { foreignSupportDocument: [{ action: "ADD", invalidField: "invalid" }] };
      const result = mapRequest.mapForeignSupportDocumentList(data);
      const documentDetails = result.foreignSupportDocumentData.AmendForeignSupportDocuments[0].SupportDocument;
      expect(documentDetails).to.not.have.property("invalidField");
    });
  });

  describe("mapForeignTaxCountryList", function () {
    it("should handle foreignTaxCountry with minimal properties", function () {
      const data = { foreignTaxCountry: [{ action: "ADD" }] };
      const result = mapRequest.mapForeignTaxCountryList(data);
      const countryDetails = result.foreignTaxCountryData.AmendForeignTaxCountry[0].ForeignTaxCountry;
      expect(countryDetails).to.not.have.property("RecordAudit");
    });

    it("should handle empty foreignTaxCountry array", function () {
      const data = { foreignTaxCountry: [] };
      const result = mapRequest.mapForeignTaxCountryList(data);
      expect(result.foreignTaxCountryData.AmendForeignTaxCountry).to.have.lengthOf(0);
    });

    it("should handle foreignTaxCountry with all properties and RecordAudit", function () {
      const data = {
        foreignTaxCountry: [
          {
            action: "UPDATE",
            lastMaintainedDate: "2024-11-03T10:20:30Z",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "testUser" }] }],
            foreignTaxCountry: "CA"
          }
        ]
      };
      const result = mapRequest.mapForeignTaxCountryList(data);
      const countryDetails = result.foreignTaxCountryData.AmendForeignTaxCountry[0].ForeignTaxCountry;
      expect(countryDetails).to.have.property("RecordAudit");
    });
  });

  describe("mapForeignTaxRoleList", function () {
    it("should handle empty foreignTaxRole array", function () {
      const data = { foreignTaxRole: [] };
      const result = mapRequest.mapForeignTaxRoleList(data);
      expect(result.foreignTaxRoleData.AmendForeignTaxRole).to.have.lengthOf(0);
    });

    it("should handle foreignTaxRole without optional properties", function () {
      const data = { foreignTaxRole: [{ action: "ADD" }] };
      const result = mapRequest.mapForeignTaxRoleList(data);
      const roleDetails = result.foreignTaxRoleData.AmendForeignTaxRole[0].ForeignTaxRole;
      expect(roleDetails).to.not.have.property("RecordAudit");
    });

    it("should handle foreignTaxRole with all properties and RecordAudit", function () {
      const data = {
        foreignTaxRole: [
          {
            action: "UPDATE",
            lastMaintainedDate: "2024-11-03T10:20:30Z",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "testUser" }] }],
            taxRole: "SomeRole"
          }
        ]
      };
      const result = mapRequest.mapForeignTaxRoleList(data);
      const roleDetails = result.foreignTaxRoleData.AmendForeignTaxRole[0].ForeignTaxRole;
      expect(roleDetails).to.have.property("RecordAudit");
    });
  });

  describe("mapForeignTaxTrustList", function () {
    it("should handle empty foreignTaxTrust array", function () {
      const data = { foreignTaxTrust: [] };
      const result = mapRequest.mapForeignTaxTrustList(data);
      expect(result.foreignTaxTrustData.AmendForeignTaxTrust).to.have.lengthOf(0);
    });

    it("should handle foreignTaxTrust with minimal properties", function () {
      const data = { foreignTaxTrust: [{ action: "ADD" }] };
      const result = mapRequest.mapForeignTaxTrustList(data);
      const trustDetails = result.foreignTaxTrustData.AmendForeignTaxTrust[0].ForeignTaxTrust;
      expect(trustDetails).to.not.have.property("RecordAudit");
    });

    it("should handle foreignTaxTrust with all properties and RecordAudit", function () {
      const data = {
        foreignTaxTrust: [
          {
            action: "UPDATE",
            lastMaintainedDate: "2024-11-03T10:20:30Z",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "testUser", refKeyValue: "id123" }] }],
            trustAccountNumber: "123456",
            preexistingProfile: true
          }
        ]
      };
      const result = mapRequest.mapForeignTaxTrustList(data);
      const trustDetails = result.foreignTaxTrustData.AmendForeignTaxTrust[0].ForeignTaxTrust;
      expect(trustDetails).to.have.property("RecordAudit");
      expect(trustDetails).to.have.property("TrustAccountNumber", "123456");
    });
  });

});
