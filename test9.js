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

    it("should handle errors in amendInvolvedParty_OCIFtoCG", async function () {
      const errorStub = new Error("Simulated Error");
      sinon.stub(mapRequest, "injectPayloadNamespace").rejects(errorStub);

      const payload = { originatorData: { country: "US" } };

      await expect(mapRequest.amendInvolvedParty_OCIFtoCG(payload)).to.be.rejectedWith("Simulated Error");

      mapRequest.injectPayloadNamespace.restore();
    });
  });

  describe("mapEnvelope", function () {
    it("should map the SOAP envelope with all data present", function () {
      const payload = { originatorData: { channel: "Online", appCatId: "App1" } };
      const result = mapRequest.mapEnvelope(payload);
      expect(result).to.have.property("IsEnvelope", true);
      expect(result.envelope).to.have.property("Header");
      expect(result.envelope.Header).to.have.property("bmoHdrRq");
    });

    it("should map envelope with missing originatorData", function () {
      const payload = {};
      const result = mapRequest.mapEnvelope(payload);
      expect(result).to.have.property("IsEnvelope", true);
      expect(result.envelope).to.have.property("Body");
    });
  });

  describe("mapSoapHeader", function () {
    it("should map SOAP header with full originator data", function () {
      const originatorData = { channel: "Web", appCatId: "App1", country: "CA" };
      const result = mapRequest.mapSoapHeader(originatorData);
      expect(result).to.have.property("IsHeader", true);
      expect(result.header.Header).to.have.property("bmoHdrRq");
    });

    it("should handle mapSoapHeader with missing originator data fields", function () {
      const originatorData = { appCatId: "App1" };
      const result = mapRequest.mapSoapHeader(originatorData);
      expect(result.header.Header.srcInfo).to.have.property("appName", "App1");
    });
  });

  describe("mapSoapBody", function () {
    it("should map the SOAP body with input header and input body", function () {
      const payload = { identifier: { id: "12345" } };
      const result = mapRequest.mapSoapBody(payload);
      expect(result).to.have.property("IsSoapBody", true);
      expect(result.soapBody.Body).to.have.property("AmendInvolvedPartyRequest");
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

    it("should use cached template without re-parsing", async function () {
      const cache = {
        [templateFilename]: {
          template: { cachedKey: "cachedValue" },
          xmlnsAttributes: [{ name: "xmlns:cached", value: "http://cachednamespace" }],
          rootNS: "cachedRootNS",
        },
      };
      
      mapRequest.SOAPTemplateCache = cache;

      const result = await mapRequest.injectPayloadNamespace(templateFilename, payload);

      expect(result).to.deep.equal({
        payloadWithNS: { injected: "value" },
        xmlnsAttributes: [{ name: "xmlns:cached", value: "http://cachednamespace" }],
        rootNS: "cachedRootNS",
      });
      sinon.restore();
    });

    it("should return the correct structure with payloadWithNS, xmlnsAttributes, and rootNS", async function () {
      const parseStringPromiseStub = sinon.stub(xml2js, "parseStringPromise").resolves({
        "soapenv:Envelope": {
          "$": { "xmlns:mock": "http://mocknamespace" },
          "soapenv:Body": [{ "mockRequest": [{ mockElement: "mockValue" }] }],
        },
      });

      const result = await mapRequest.injectPayloadNamespace(templateFilename, payload);

      expect(result).to.have.keys("payloadWithNS", "xmlnsAttributes", "rootNS");
      expect(result.payloadWithNS).to.be.an("object");
      expect(result.xmlnsAttributes).to.be.an("array");
      expect(result.rootNS).to.be.a("string");

      parseStringPromiseStub.restore();
    });

    it("should throw an error if template parsing fails", async function () {
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

    it("should handle plain values in the payload", function () {
      const template = { "ns:Simple": {} };
      const payload = { Simple: "JustAValue" };

      const result = mapRequest._injectNamespace(template, payload);

      expect(result).to.deep.equal({
        "ns:Simple": "JustAValue",
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
});
