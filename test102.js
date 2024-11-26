const chaiAsPromised = require("chai-as-promised");
const chai = require("chai");
const sinon = require("sinon");
const { expect, assert } = chai;
chai.use(chaiAsPromised);

const {
  getInvolvedParty_OCIFtoCG,
  mapForeignTaxCountryList
} = require("../service/subService/getInvolvedParty/mapResponse");

const xmlResponseBody = require("./mockData/xmlResponsebody.json").body;
const xmlResponseBody329 = require("./mockData/xmlResponseBody329.json").body;
const xmlResponseBody429 = require("./mockData/xmlResponseBody429.json").body;
const noForeignTaxCountry = require("./mockData/xmlResponseNoForeignTaxCountry.json").body;
const requestControlObj = require("./mockData/requestControlObj.json");
const mockData = require("./mockData/mocks");

describe("Testing mapResponse.js", function () {
  describe("getInvolvedParty_OCIFtoCG", function () {
    it("xmlResponseBody329 should equal expected response", async function () {
      const result = await getInvolvedParty_OCIFtoCG(mockData.args, xmlResponseBody429, 200, requestControlObj);
      expect(result).to.be.an("object");
      expect(result).to.have.property("statusCode").that.is.a("number");
      expect(result).to.have.property("body").that.is.an("object");
      expect(result.statusCode).to.equal(200);
    });

    it("noForeignTaxCountry should equal expected response", async function () {
      const result = await getInvolvedParty_OCIFtoCG(mockData.args, noForeignTaxCountry, 200, requestControlObj);
      expect(result).to.be.an("object");
      expect(result).to.have.property("statusCode").that.is.a("number");
      expect(result).to.have.property("body").that.is.an("object");
      expect(result.statusCode).to.equal(200);
      expect(result.body).to.have.property("foreignTaxCountryList").that.is.an("array");
    });
  });

  describe("Testing mapForeignTaxCountryList using xmlResponsebody.json", function () {
    it("should return an empty response when no foreign tax country data is found", async function () {
      const data = xmlResponseBody;
      // Modify the data to simulate no foreign tax country data being present
      data.ListControl.TotalRecords = 0;
      const result = await mapForeignTaxCountryList(data, "ForeignTaxCountry", true);
      
      expect(result).to.be.an("object");
      expect(result).to.have.property("responseControl").that.is.a("boolean");
      expect(result.responseControl).to.equal(false);
      expect(result).to.have.property("body").that.is.a("string");
      expect(result.body).to.equal("no record found for ForeignTaxCountry");
    });

    it("should return a mapped response with correct data when foreign tax country data is available", async function () {
      const data = xmlResponseBody;
      // Modify the data to include valid foreign tax country information
      data.ForeignTaxCountry = [
        {
          countryName: "Canada",
          taxIdentificationNumber: "123456789"
        }
      ];
      data.ListControl.TotalRecords = 1;
      const result = await mapForeignTaxCountryList(data, "ForeignTaxCountry", true);
      
      expect(result).to.be.an("object");
      expect(result).to.have.property("responseControl").that.is.a("boolean");
      expect(result.responseControl).to.equal(true);
      expect(result).to.have.property("body").that.is.an("array").that.is.not.empty;
      expect(result.body[0]).to.have.property("countryName").that.is.a("string");
      expect(result.body[0]).to.have.property("taxIdentificationNumber").that.is.a("string");
    });

    it("should handle missing ListControl data gracefully", async function () {
      const data = xmlResponseBody;
      // Remove the ListControl data to simulate it being missing
      delete data.ListControl;
      const result = await mapForeignTaxCountryList(data, "ForeignTaxCountry", true);
      
      expect(result).to.be.an("object");
      expect(result).to.have.property("responseControl").that.is.a("boolean");
      expect(result.responseControl).to.equal(true);
      expect(result).to.have.property("body").that.is.an("array").that.is.not.empty;
    });
  });
});
