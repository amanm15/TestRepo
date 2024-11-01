const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire");
const xml2js = require("xml2js");

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
  
    it("should handle errors and log them", async function () {
      const payload = null;
      const result = mapRequest.amendInvolvedParty_OCIFtoCG(payload);
      await expect(result).to.be.rejected;
      expect(logErrorStub.called).to.be.true;
    });
  });

  describe("injectPayloadNamespace", function () {
    let templateFilename, payload;

    beforeEach(() => {
      templateFilename = "testTemplate.xml";
      payload = { sampleKey: "sampleValue" };
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should parse and cache the template when SOAPTemplateCache is empty", async function () {
      const parseStringPromiseStub = sinon.stub(xml2js, "parseStringPromise").resolves({
        "soapenv:Envelope": {
          "$": { "xmlns:mock": "http://mocknamespace" },
          "soapenv:Body": [{ "mockRequest": [{ mockElement: "mockValue" }] }],
        },
      });

      const result = await mapRequest.injectPayloadNamespace(templateFilename, payload);

      expect(result).to.have.property("xmlnsAttributes").that.is.an("array").with.lengthOf(1);
      expect(result.xmlnsAttributes[0]).to.include({ name: "xmlns:mock", value: "http://mocknamespace" });
      parseStringPromiseStub.restore();
    });

    it("should use cached template if SOAPTemplateCache is not empty", async function () {
      mapRequest.SOAPTemplateCache = {
        [templateFilename]: {
          template: { cachedKey: "cachedValue" },
          xmlnsAttributes: [{ name: "xmlns:cached", value: "http://cachednamespace" }],
          rootNS: "cachedRootNS",
        },
      };

      const result = await mapRequest.injectPayloadNamespace(templateFilename, payload);

      expect(result.xmlnsAttributes[0]).to.include({ name: "xmlns:cached", value: "http://cachednamespace" });
      expect(result.rootNS).to.equal("cachedRootNS");
    });

    it("should handle parsing errors in try-catch", async function () {
      const parseStringPromiseStub = sinon.stub(xml2js, "parseStringPromise").rejects(new Error("Parsing Error"));
      await expect(mapRequest.injectPayloadNamespace(templateFilename, payload)).to.be.rejectedWith("Parsing Error");
      parseStringPromiseStub.restore();
    });
  });

  describe("_injectNamespace", function () {
    it("should handle array values in the payload", function () {
      const template = { "ns:Items": [{ "ns:Item": { "ns:Name": {} } }] };
      const payload = { Items: [{ Name: "Item1" }] };

      const result = mapRequest._injectNamespace(template, payload);

      expect(result).to.deep.equal({
        "ns:Items": [{ "ns:Item": { "ns:Name": "Item1" } }],
      });
    });

    it("should handle nested object values in the payload", function () {
      const template = { "ns:Parent": { "ns:Child": { "ns:Grandchild": {} } } };
      const payload = { Parent: { Child: { Grandchild: "Value" } } };

      const result = mapRequest._injectNamespace(template, payload);

      expect(result).to.deep.equal({
        "ns:Parent": { "ns:Child": { "ns:Grandchild": "Value" } },
      });
    });

    it("should skip keys not present in the payload", function () {
      const template = { "ns:UnusedKey": {}, "ns:UsedKey": {} };
      const payload = { UsedKey: "Value" };

      const result = mapRequest._injectNamespace(template, payload);

      expect(result).to.deep.equal({
        "ns:UsedKey": "Value",
      });
    });

    it("should handle empty template and payload objects", function () {
      const template = {};
      const payload = {};

      const result = mapRequest._injectNamespace(template, payload);

      expect(result).to.deep.equal({});
    });
  });

  // Additional tests for mapForeignIndiciaList, mapForeignTaxTrustList and others as before, ensuring
  // they include both empty arrays (to test false paths) and actual payloads to test all expected branches
});
