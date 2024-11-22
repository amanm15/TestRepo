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

describe("Testing mapResponse.js", function () {
  describe("getInvolvedParty_OCIFtoCG", function () {
    it("should return a mapped failure response when status code is not 200", async function () {
      const xmlData = "<Envelope><Body><Fault><faultcode>Client</faultcode><detail>Error occurred</detail></Fault></Body></Envelope>";
      const result = await getInvolvedParty_OCIFtoCG(mockData.args, xmlData, 400, mockData.requestControlObj);
      expect(result).to.deep.equal(mapFailureResponse(400, "Client", '"Error occurred"'));
    });

    it("should return a mapped success response when status code is 200", async function () {
      const xmlData = "<Envelope><Body><GetInvolvedPartyResponse><GetInvolvedPartyOutputBody>Success</GetInvolvedPartyOutputBody></GetInvolvedPartyResponse></Body></Envelope>";
      const result = await getInvolvedParty_OCIFtoCG(mockData.args, xmlData, 200, mockData.requestControlObj);
      expect(result.statusCode).to.equal(200);
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
    it("should return a success response with empty body when data is missing", async function () {
      const result = await mapSuccessResponse(200, null, mockData.emptyRequestControlObj);
      expect(result.statusCode).to.equal(200);
      expect(result.body).to.be.empty;
    });
  });

  describe("convertOCIFtoISODateTimestamp", function () {
    it("should convert date string to ISO format with date only", function () {
      const result = convertOCIFtoISODateTimestamp("2023-09-27T20:49:19.198Z", true);
      expect(result).to.equal("2023-09-27");
    });

    it("should convert date string to full ISO timestamp", function () {
      const result = convertOCIFtoISODateTimestamp("2023-09-27T20:49:19.198Z", false);
      expect(result).to.equal("2023-09-27T20:49:19.198Z");
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
});
