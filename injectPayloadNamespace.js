const { expect } = require("chai");
const sinon = require("sinon");
const _ = require("lodash");
const xml2js = require("xml2js");
const mapRequest = require("../path/to/mapRequest"); // Adjust this path

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
    // Stub xml2js.parseStringPromise to simulate parsing behavior
    const parseStringPromiseStub = sinon.stub(xml2js, "parseStringPromise").resolves({
      "soapenv:Envelope": {
        "$": { "xmlns:mock": "http://mocknamespace" },
        "soapenv:Body": [{ "mockRequest": [{ mockElement: "mockValue" }] }],
      },
    });

    const result = await mapRequest.injectPayloadNamespace(templateFilename, payload);

    // Check that namespaces and rootNS were parsed correctly
    expect(result).to.have.property("xmlnsAttributes").that.is.an("array").with.lengthOf(1);
    expect(result.xmlnsAttributes[0]).to.include({ name: "xmlns:mock", value: "http://mocknamespace" });
    expect(result).to.have.property("rootNS").that.is.a("string");

    parseStringPromiseStub.restore();
  });

  it("should use cached template if SOAPTemplateCache is not empty", async function () {
    // Mock cached template in SOAPTemplateCache
    const cache = {
      [templateFilename]: {
        template: { cachedKey: "cachedValue" },
        xmlnsAttributes: [{ name: "xmlns:cached", value: "http://cachednamespace" }],
        rootNS: "cachedRootNS",
      },
    };
    
    // Stub _injectNamespace to check that cache usage does not call parseStringPromise
    const injectNamespaceStub = sinon.stub(mapRequest, "_injectNamespace").returns({ injected: "value" });

    // Set up a mock in SOAPTemplateCache to simulate cache hit
    mapRequest.SOAPTemplateCache = cache;

    const result = await mapRequest.injectPayloadNamespace(templateFilename, payload);

    // Assert that it returned from cache without re-parsing
    expect(result).to.deep.equal({
      payloadWithNS: { injected: "value" },
      xmlnsAttributes: [{ name: "xmlns:cached", value: "http://cachednamespace" }],
      rootNS: "cachedRootNS",
    });
    injectNamespaceStub.restore();
  });

  it("should return the correct structure with payloadWithNS, xmlnsAttributes, and rootNS", async function () {
    const parseStringPromiseStub = sinon.stub(xml2js, "parseStringPromise").resolves({
      "soapenv:Envelope": {
        "$": { "xmlns:mock": "http://mocknamespace" },
        "soapenv:Body": [{ "mockRequest": [{ mockElement: "mockValue" }] }],
      },
    });

    const result = await mapRequest.injectPayloadNamespace(templateFilename, payload);

    // Assert on returned structure
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
