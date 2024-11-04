const { expect } = require("chai");
const sinon = require("sinon");
const mapRequest = require("../path/to/mapRequest");  // Adjust path as necessary

describe("Branch Coverage Tests for mapRequest Functions", function () {

  describe("mapForeignIndiciaList", function () {
    it("should handle foreignIndicia with RecordAudit, LastMaintainedUser, and ObjectIdentifier", function () {
      const data = {
        foreignIndicia: [
          {
            action: "ADD",
            lastMaintainedDate: "2024-11-03T10:20:30Z",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "testUser", refKeyValue: "id123" }] }],
            informationCollectedTimestamp: "2024-11-02T10:20:30Z",
            transitNumber: "12345",
            foreignTaxIdentifier: "FTI123",
            classificationScheme: "Scheme1",
            foreignTaxCountry: "US",
            owningIprt: "IPRT001",
            informationCollectorId: "CollectorID",
            informationCollectorName: "CollectorName"
          }
        ]
      };
      const result = mapRequest.mapForeignIndiciaList(data);
      expect(result.IsForeignIndiciaList).to.be.true;
      expect(result.foreignIndiciaData.AmendForeignIndicia).to.have.lengthOf(1);
      const indiciaDetails = result.foreignIndiciaData.AmendForeignIndicia[0].ForeignIndicia;
      expect(indiciaDetails).to.include.keys("RecordAudit", "TransitNumber", "ForeignTaxCountry");
    });

    it("should handle missing optional properties in foreignIndicia objects", function () {
      const data = { foreignIndicia: [{ action: "ADD" }] };
      const result = mapRequest.mapForeignIndiciaList(data);
      const indiciaDetails = result.foreignIndiciaData.AmendForeignIndicia[0].ForeignIndicia;
      expect(indiciaDetails).to.not.have.property("ObjectIdentifier");
      expect(indiciaDetails).to.not.have.property("TransitNumber");
    });
  });

  describe("mapForeignSupportDocumentList", function () {
    it("should map foreignSupportDocument list with RecordAudit and DocumentStatus", function () {
      const data = {
        foreignSupportDocument: [
          {
            action: "ADD",
            lastMaintainedDate: "2024-11-03T10:20:30Z",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "testUser", refKeyValue: "id123" }] }],
            documentStatus: "Verified",
            foreignTaxIdentifier: "FTI123"
          }
        ]
      };
      const result = mapRequest.mapForeignSupportDocumentList(data);
      expect(result.IsForeignSupportDocument).to.be.true;
      expect(result.foreignSupportDocumentData.AmendForeignSupportDocuments).to.have.lengthOf(1);
      const documentDetails = result.foreignSupportDocumentData.AmendForeignSupportDocuments[0].SupportDocument;
      expect(documentDetails).to.include.keys("RecordAudit", "DocumentStatus", "ForeignTaxIdentifier");
    });

    it("should handle missing optional properties in foreignSupportDocument objects", function () {
      const data = { foreignSupportDocument: [{ action: "REMOVE" }] };
      const result = mapRequest.mapForeignSupportDocumentList(data);
      const documentDetails = result.foreignSupportDocumentData.AmendForeignSupportDocuments[0].SupportDocument;
      expect(documentDetails).to.not.have.property("ForeignTaxIdentifier");
      expect(documentDetails).to.not.have.property("DocumentStatus");
    });
  });

  describe("mapForeignTaxCountryList", function () {
    it("should map foreignTaxCountry list with CountyOfResidenceStatus and RecordAudit", function () {
      const data = {
        foreignTaxCountry: [
          {
            action: "UPDATE",
            lastMaintainedDate: "2024-11-03T10:20:30Z",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "testUser", refKeyValue: "id123" }] }],
            foreignTaxCountry: "CA",
            countyOfResidenceStatus: "Resident",
            userNameCountryDeclared: "CountryDeclarer"
          }
        ]
      };
      const result = mapRequest.mapForeignTaxCountryList(data);
      expect(result.IsForeignTaxCountry).to.be.true;
      expect(result.foreignTaxCountryData.AmendForeignTaxCountry).to.have.lengthOf(1);
      const countryDetails = result.foreignTaxCountryData.AmendForeignTaxCountry[0].ForeignTaxCountry;
      expect(countryDetails).to.include.keys("RecordAudit", "ForeignTaxCountry", "CountyOfResidenceStatus");
    });

    it("should handle missing optional properties in foreignTaxCountry objects", function () {
      const data = { foreignTaxCountry: [{ action: "REMOVE" }] };
      const result = mapRequest.mapForeignTaxCountryList(data);
      const countryDetails = result.foreignTaxCountryData.AmendForeignTaxCountry[0].ForeignTaxCountry;
      expect(countryDetails).to.not.have.property("ForeignTaxCountry");
      expect(countryDetails).to.not.have.property("CountyOfResidenceStatus");
    });
  });

  describe("mapForeignTaxRoleList", function () {
    it("should map foreignTaxRole list with TaxRole and RecordAudit", function () {
      const data = {
        foreignTaxRole: [
          {
            action: "ADD",
            lastMaintainedDate: "2024-11-03T10:20:30Z",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "testUser", refKeyValue: "id123" }] }],
            taxRole: "TaxRoleValue",
            taxRoleStatus: "Active"
          }
        ]
      };
      const result = mapRequest.mapForeignTaxRoleList(data);
      expect(result.IsForeignTaxRole).to.be.true;
      expect(result.foreignTaxRoleData.AmendForeignTaxRole).to.have.lengthOf(1);
      const roleDetails = result.foreignTaxRoleData.AmendForeignTaxRole[0].ForeignTaxRole;
      expect(roleDetails).to.include.keys("RecordAudit", "TaxRole", "TaxRoleStatus");
    });

    it("should handle missing optional properties in foreignTaxRole objects", function () {
      const data = { foreignTaxRole: [{ action: "DELETE" }] };
      const result = mapRequest.mapForeignTaxRoleList(data);
      const roleDetails = result.foreignTaxRoleData.AmendForeignTaxRole[0].ForeignTaxRole;
      expect(roleDetails).to.not.have.property("TaxRole");
      expect(roleDetails).to.not.have.property("TaxRoleStatus");
    });
  });

  describe("mapForeignTaxTrustList", function () {
    it("should map foreignTaxTrust list with RecordAudit, TrustAccountNumber, and SystemIdentificationCode", function () {
      const data = {
        foreignTaxTrust: [
          {
            action: "UPDATE",
            lastMaintainedDate: "2024-11-03T10:20:30Z",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "testUser", refKeyValue: "id123" }] }],
            trustAccountNumber: "TAN123",
            systemIdentificationCode: "SIC456",
            preexistingProfile: true
          }
        ]
      };
      const result = mapRequest.mapForeignTaxTrustList(data);
      expect(result.IsForeignTaxTrust).to.be.true;
      expect(result.foreignTaxTrustData.AmendForeignTaxTrust).to.have.lengthOf(1);
      const trustDetails = result.foreignTaxTrustData.AmendForeignTaxTrust[0].ForeignTaxTrust;
      expect(trustDetails).to.include.keys("RecordAudit", "TrustAccountNumber", "SystemIdentificationCode");
    });

    it("should handle missing optional properties in foreignTaxTrust objects", function () {
      const data = { foreignTaxTrust: [{ action: "ADD" }] };
      const result = mapRequest.mapForeignTaxTrustList(data);
      const trustDetails = result.foreignTaxTrustData.AmendForeignTaxTrust[0].ForeignTaxTrust;
      expect(trustDetails).to.not.have.property("TrustAccountNumber");
      expect(trustDetails).to.not.have.property("SystemIdentificationCode");
    });
  });

});
