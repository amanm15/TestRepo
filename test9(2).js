const { expect } = require("chai");
const mapRequest = require("../path/to/mapRequest");

describe("Boundary Testing for mapRequest Functions", function () {

  describe("mapForeignIndiciaList", function () {
    it("should handle an empty foreignIndicia array", function () {
      const data = { foreignIndicia: [] };
      const result = mapRequest.mapForeignIndiciaList(data);
      expect(result.foreignIndiciaData.AmendForeignIndicia).to.be.an("array").that.is.empty;
    });

    it("should handle a single-element foreignIndicia array", function () {
      const data = { foreignIndicia: [{ action: "ADD" }] };
      const result = mapRequest.mapForeignIndiciaList(data);
      expect(result.foreignIndiciaData.AmendForeignIndicia).to.have.lengthOf(1);
    });

    it("should handle a large foreignIndicia array", function () {
      const data = { foreignIndicia: Array(100).fill({ action: "ADD" }) };
      const result = mapRequest.mapForeignIndiciaList(data);
      expect(result.foreignIndiciaData.AmendForeignIndicia).to.have.lengthOf(100);
    });
  });

  describe("mapForeignSupportDocumentList", function () {
    it("should handle an empty foreignSupportDocument array", function () {
      const data = { foreignSupportDocument: [] };
      const result = mapRequest.mapForeignSupportDocumentList(data);
      expect(result.foreignSupportDocumentData.AmendForeignSupportDocuments).to.be.an("array").that.is.empty;
    });

    it("should handle a single-element foreignSupportDocument array", function () {
      const data = { foreignSupportDocument: [{ action: "ADD", documentStatus: "Verified" }] };
      const result = mapRequest.mapForeignSupportDocumentList(data);
      expect(result.foreignSupportDocumentData.AmendForeignSupportDocuments).to.have.lengthOf(1);
    });

    it("should handle a large foreignSupportDocument array", function () {
      const data = { foreignSupportDocument: Array(100).fill({ action: "ADD", documentStatus: "Verified" }) };
      const result = mapRequest.mapForeignSupportDocumentList(data);
      expect(result.foreignSupportDocumentData.AmendForeignSupportDocuments).to.have.lengthOf(100);
    });
  });

  describe("mapForeignTaxCountryList", function () {
    it("should handle an empty foreignTaxCountry array", function () {
      const data = { foreignTaxCountry: [] };
      const result = mapRequest.mapForeignTaxCountryList(data);
      expect(result.foreignTaxCountryData.AmendForeignTaxCountry).to.be.an("array").that.is.empty;
    });

    it("should handle a single-element foreignTaxCountry array", function () {
      const data = { foreignTaxCountry: [{ action: "ADD", foreignTaxStatusType: "Active" }] };
      const result = mapRequest.mapForeignTaxCountryList(data);
      expect(result.foreignTaxCountryData.AmendForeignTaxCountry).to.have.lengthOf(1);
    });

    it("should handle a large foreignTaxCountry array", function () {
      const data = { foreignTaxCountry: Array(100).fill({ action: "ADD", foreignTaxStatusType: "Active" }) };
      const result = mapRequest.mapForeignTaxCountryList(data);
      expect(result.foreignTaxCountryData.AmendForeignTaxCountry).to.have.lengthOf(100);
    });
  });

  describe("mapForeignTaxRoleList", function () {
    it("should handle an empty foreignTaxRole array", function () {
      const data = { foreignTaxRole: [] };
      const result = mapRequest.mapForeignTaxRoleList(data);
      expect(result.foreignTaxRoleData.AmendForeignTaxRole).to.be.an("array").that.is.empty;
    });

    it("should handle a single-element foreignTaxRole array", function () {
      const data = { foreignTaxRole: [{ action: "ADD", usCitizen: true }] };
      const result = mapRequest.mapForeignTaxRoleList(data);
      expect(result.foreignTaxRoleData.AmendForeignTaxRole).to.have.lengthOf(1);
    });

    it("should handle a large foreignTaxRole array", function () {
      const data = { foreignTaxRole: Array(100).fill({ action: "ADD", usCitizen: true }) };
      const result = mapRequest.mapForeignTaxRoleList(data);
      expect(result.foreignTaxRoleData.AmendForeignTaxRole).to.have.lengthOf(100);
    });
  });

  describe("mapForeignTaxTrustList", function () {
    it("should handle an empty foreignTaxTrust array", function () {
      const data = { foreignTaxTrust: [] };
      const result = mapRequest.mapForeignTaxTrustList(data);
      expect(result.foreignTaxTrustData.AmendForeignTaxTrust).to.be.an("array").that.is.empty;
    });

    it("should handle a single-element foreignTaxTrust array", function () {
      const data = { foreignTaxTrust: [{ action: "ADD", trustAccountNumber: "12345" }] };
      const result = mapRequest.mapForeignTaxTrustList(data);
      expect(result.foreignTaxTrustData.AmendForeignTaxTrust).to.have.lengthOf(1);
    });

    it("should handle a large foreignTaxTrust array", function () {
      const data = { foreignTaxTrust: Array(100).fill({ action: "ADD", trustAccountNumber: "12345" }) };
      const result = mapRequest.mapForeignTaxTrustList(data);
      expect(result.foreignTaxTrustData.AmendForeignTaxTrust).to.have.lengthOf(100);
    });
  });
});
