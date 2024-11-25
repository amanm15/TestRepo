const chaiAsPromised = require("chai-as-promised");
const chai = require("chai");
const sinon = require("sinon");
const { expect } = chai;
chai.use(chaiAsPromised);

const {
  getInvolvedParty_OCIFtoCG,
  mapFailureResponse,
  mapRecordNoFoundResponse,
  mapSuccessResponse,
  mapForeignTaxEntityObj,
  mapForeignTaxTrustList,
  mapForeignIndiciaList,
  mapForeignSupportDocumentList,
  mapForeignTaxCountryList,
  mapForeignTaxIndividualObj,
  mapForeignTaxRoleList,
  convertOCIFtoISODateTimestamp,
} = require("../service/subService/getInvolvedParty/mapResponse");

const mockData = require("./mockData/mocks");
const requestControlObj = require("./mockData/requestControlObj.json");
const xmlResponseBody329 = require("./mockData/xmlResponseBody329.json").body;

describe("Testing mapResponse.js", function () {
  describe("getInvolvedParty_OCIFtoCG", function () {
    it("should return an object when called with valid arguments", async function () {
      const result = await getInvolvedParty_OCIFtoCG(mockData.args, xmlResponseBody329, 200, requestControlObj);
      expect(result).to.be.an("object");
      expect(result).to.have.property("statusCode");
      expect(result.statusCode).to.be.a("number");
    });
  });

  describe("mapFailureResponse", function () {
    it("should return an object with proper structure", function () {
      const result = mapFailureResponse(400, "ClientError", "Invalid request");
      expect(result).to.be.an("object");
      expect(result).to.have.property("statusCode").that.is.a("number");
      expect(result).to.have.property("body").that.is.an("object");
      expect(result.body).to.have.property("type").that.is.a("string");
      expect(result.body).to.have.property("title").that.is.a("string");
      expect(result.body).to.have.property("status").that.is.a("number");
      expect(result.body).to.have.property("detail").that.is.a("string");
    });
  });

  describe("mapRecordNoFoundResponse", function () {
    it("should return an object with correct data types", function () {
      const result = mapRecordNoFoundResponse();
      expect(result).to.be.an("object");
      expect(result).to.have.property("statusCode").that.is.a("number");
      expect(result.statusCode).to.equal(404);
      expect(result).to.have.property("body").that.is.an("object");
      expect(result.body).to.have.property("type").that.is.a("string");
      expect(result.body).to.have.property("title").that.is.a("string");
      expect(result.body).to.have.property("status").that.is.a("number");
      expect(result.body).to.have.property("detail").that.is.a("string");
    });
  });

  describe("mapSuccessResponse", function () {
    it("should return an object with a status code and body", async function () {
      const result = await mapSuccessResponse(200, mockData.plainResponse, requestControlObj);
      expect(result).to.be.an("object");
      expect(result).to.have.property("statusCode").that.is.a("number");
      expect(result).to.have.property("body").that.is.an("object");
    });
  });

  describe("convertOCIFtoISODateTimestamp", function () {
    it("should return a string for ISO date with date only", function () {
      const result = convertOCIFtoISODateTimestamp("2024-07-12T20:49:19.198Z", true);
      expect(result).to.be.a("string");
    });

    it("should return a string for full ISO timestamp", function () {
      const result = convertOCIFtoISODateTimestamp("2024-07-12T20:49:19.198Z", false);
      expect(result).to.be.a("string");
    });
  });

  describe("mapForeignTaxEntityObj", function () {
    it("should return an object when data is present", async function () {
      const result = await mapForeignTaxEntityObj(mockData.plainResponse, "ForeignTaxEntity", true);
      expect(result).to.be.an("object");
      expect(result).to.have.property("responseControl").that.is.a("boolean");
      expect(result).to.have.property("body");
      expect(typeof result.body === "string" || typeof result.body === "object").to.be.true;
    });
  });

  describe("mapForeignSupportDocumentList", function () {
    it("should return an object and body should be an array or a string", async function () {
      const result = await mapForeignSupportDocumentList(mockData.plainResponse, "ForeignSupportDocument", true);
      expect(result).to.be.an("object");
      expect(result).to.have.property("responseControl").that.is.a("boolean");
      expect(result).to.have.property("body");
      expect(Array.isArray(result.body) || typeof result.body === "string").to.be.true;
    });
  });

  describe("mapForeignTaxTrustList", function () {
    it("should return an object with correct responseControl and body", async function () {
      const data = { ForeignTaxTrust: {}, ListControl: { TotalRecords: 0 } };
      const result = await mapForeignTaxTrustList(data, "ForeignTaxTrust", true);
      expect(result).to.be.an("object");
      expect(result).to.have.property("responseControl").that.is.a("boolean");
      expect(result.responseControl).to.equal(false);
      expect(result).to.have.property("body").that.is.a("string");
    });
  });
});
