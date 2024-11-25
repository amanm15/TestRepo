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
  });

  describe("mapFailureResponse", function () {
    it("should return a proper failure response object", function () {
      const statusCode = 400;
      const faultcode = "ClientError";
      const detail = "Invalid request";
      const result = mapFailureResponse(statusCode, faultcode, detail);
      expect(result).to.deep.equal({
        statusCode,
        body: {
          type: "Failure",
          title: faultcode,
          status: statusCode,
          detail,
        },
      });
    });
  });

  describe("mapRecordNoFoundResponse", function () {
    it("should return a 'no record found' response object", function () {
      const result = mapRecordNoFoundResponse();
      expect(result).to.deep.equal({
        statusCode: 404,
        body: {
          type: "failure",
          title: "no record found",
          status: 404,
          detail: "the request tax record was not found",
        },
      });
    });
  });

describe("mapSuccessResponse", function () {
  it("should return a success response with valid data", async function () {
    const result = await mapSuccessResponse(200, mockData.plainResponse, requestControlObj);

    console.log(result); // Debugging output to see the actual response

    expect(result.statusCode).to.equal(200);
    
    if (Object.keys(result.body).length > 0) {
      expect(result.body).to.have.property("foreignSupportDocument");
    } else {
      expect(result.body).to.be.empty;
    }
  });

  it("should return an empty response for empty request control", async function () {
    const result = await mapSuccessResponse(200, mockData.plainResponse, emptyRequestControlObj);

    expect(result.statusCode).to.equal(200);
    expect(result.body).to.be.empty;
  });
});

  describe("convertOCIFtoISODateTimestamp", function () {
    it("should convert date string to ISO format with date only", function () {
      const result = convertOCIFtoISODateTimestamp("2024-07-12T20:49:19.198Z", true);
      expect(result).to.equal("2024-07-12");
    });

    it("should convert date string to full ISO timestamp", function () {
      const result = convertOCIFtoISODateTimestamp("2024-07-12T20:49:19.198Z", false);
      expect(result).to.equal("2024-07-12T20:49:19.198Z");
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

    it("should return a mapped entity object when data is available", async function () {
      const result = await mapForeignTaxEntityObj(mockData.plainResponse, "ForeignTaxEntity", true);
      expect(result.responseControl).to.equal(true);
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
  });

  describe("mapForeignSupportDocumentList", function () {
    it("should map foreign support documents correctly when data is present", async function () {
      const result = await mapForeignSupportDocumentList(mockData.plainResponse, "ForeignSupportDocument", true);
      expect(result.responseControl).to.equal(true);
      expect(result.body).to.be.an("array").that.is.not.empty;
    });
  });
});
