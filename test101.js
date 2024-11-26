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
const xmlResponseBody629 = require("./mockData/xmlResponseBody629.json").body;
const xmlResponseBody429 = require("./mockData/xmlResponseBody429.json").body;
const xmlResponseBody = require("./mockData/xmlResponsebody.json").body;
const noForeignTaxCountry = require("./mockData/xmlResponseNoForeignTaxCountry.json").body;
const emptyRequestControlObj = require("./mockData/emptyRequestControlObj.json");
const requestControlObjForeignTaxRoleFalse = require("./mockData/requestControlObjForeignTaxRoleFalse.json");
const requestControlObjForeignTaxEntFalse = require("./mockData/requestControlObjForeignTaxEntFalse.json");
const requestControlObjForeignTaxCountryFalse = require("./mockData/requestControlObjForeignTaxCountryFalse.json");

describe("Testing mapResponse.js", function () {
  describe("getInvolvedParty_OCIFtoCG", function () {
    it("should return a mapped failure response when status code is not 200", async function () {
      const xmlData = xmlResponseBody329;
      const result = await getInvolvedParty_OCIFtoCG(mockData.args, xmlData, 400, requestControlObj);
      expect(result).to.deep.equal(mapFailureResponse(400, "ClientError", "An error occurred in the response"));
    });

    it("should return a mapped success response when status code is 200", async function () {
      const xmlData = xmlResponseBody629;
      const result = await getInvolvedParty_OCIFtoCG(mockData.args, xmlData, 200, requestControlObj);
      expect(result.statusCode).to.equal(200);
      expect(result.body).to.have.property("foreignSupportDocument");
    });

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
    it("should return a success response with valid data", async function () {
      const result = await mapSuccessResponse(200, mockData.plainResponse, requestControlObj);
      expect(result.statusCode).to.equal(200);
      expect(result.body).to.have.property("foreignSupportDocument");
    });

    it("should return an empty response for empty request control", async function () {
      const result = await mapSuccessResponse(200, mockData.plainResponse, emptyRequestControlObj);
      expect(result.statusCode).to.equal(200);
      expect(result.body).to.be.empty;
    });

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
    it("should return a 'no record found' response when data is missing", async function () {
      const result = await mapForeignTaxEntityObj({}, "ForeignTaxEntity", true);
      expect(result).to.deep.equal({
        responseControl: false,
        body: "no record found for ForeignTaxEntity",
      });
    });

    it("should return an object when data is present", async function () {
      const result = await mapForeignTaxEntityObj(mockData.plainResponse, "ForeignTaxEntity", true);
      expect(result).to.be.an("object");
      expect(result).to.have.property("responseControl").that.is.a("boolean");
      expect(result).to.have.property("body");
      expect(typeof result.body === "string" || typeof result.body === "object").to.be.true;
    });
  });

  describe("mapForeignTaxTrustList", function () {
    it("should return an empty body when no records are found", async function () {
      const data = { ForeignTaxTrust: {}, ListControl: { TotalRecords: 0 } };
      const result = await mapForeignTaxTrustList(data, "ForeignTaxTrust", true);
      expect(result).to.deep.equal({
        responseControl: false,
        body: "no record found for ForeignTaxTrust",
      });
    });

    it("should return an object with correct responseControl and body", async function () {
      const data = { ForeignTaxTrust: {}, ListControl: { TotalRecords: 0 } };
      const result = await mapForeignTaxTrustList(data, "ForeignTaxTrust", true);
      expect(result).to.be.an("object");
      expect(result).to.have.property("responseControl").that.is.a("boolean");
      expect(result.responseControl).to.equal(false);
      expect(result).to.have.property("body").that.is.a("string");
    });
  });

  describe("mapForeignSupportDocumentList", function () {
    it("should map foreign support documents correctly when data is present", async function () {
      const result = await mapForeignSupportDocumentList(mockData.plainResponse, "ForeignSupportDocument", true);
      expect(result.responseControl).to.equal(true);
      expect(result.body).to.be.an("array").that.is.not.empty;
    });

    it("should return an object and body should be an array or a string", async function () {
      const result = await mapForeignSupportDocumentList(mockData.plainResponse, "ForeignSupportDocument", true);
      expect(result).to.be.an("object");
      expect(result).to.have.property("responseControl").that.is.a("boolean");
      expect(result).to.have.property("body");
      expect(Array.isArray(result.body) || typeof result.body === "string").to.be.true;
    });
  });

describe("mapForeignTaxCountryList", function () {
  it("should return an empty response when no foreign tax country data is found", async function () {
    const data = { ForeignTaxCountry: {}, ListControl: { TotalRecords: 0 } };
    const result = await mapForeignTaxCountryList(data, "ForeignTaxCountry", true);
    
    expect(result).to.be.an("object");
    expect(result).to.have.property("responseControl").that.is.a("boolean");
    expect(result.responseControl).to.equal(false);
    expect(result).to.have.property("body").that.is.a("string");
    expect(result.body).to.equal("no record found for ForeignTaxCountry");
  });

  it("should return a mapped response with correct data when foreign tax country data is available", async function () {
    const data = {
      ForeignTaxCountry: [
        {
          countryName: "Canada",
          taxIdentificationNumber: "123456789"
        }
      ],
      ListControl: { TotalRecords: 1 }
    };
    const result = await mapForeignTaxCountryList(data, "ForeignTaxCountry", true);
    
    expect(result).to.be.an("object");
    expect(result).to.have.property("responseControl").that.is.a("boolean");
    expect(result.responseControl).to.equal(true);
    expect(result).to.have.property("body").that.is.an("array").that.is.not.empty;
    expect(result.body[0]).to.have.property("countryName").that.is.a("string");
    expect(result.body[0]).to.have.property("taxIdentificationNumber").that.is.a("string");
  });

  it("should handle missing ListControl data gracefully", async function () {
    const data = {
      ForeignTaxCountry: [
        {
          countryName: "United States",
          taxIdentificationNumber: "987654321"
        }
      ]
    };
    const result = await mapForeignTaxCountryList(data, "ForeignTaxCountry", true);
    
    expect(result).to.be.an("object");
    expect(result).to.have.property("responseControl").that.is.a("boolean");
    expect(result.responseControl).to.equal(true);
    expect(result).to.have.property("body").that.is.an("array").that.is.not.empty;
  });
});
  
});
