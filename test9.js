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
  });

  describe("mapEnvelope", function () {
    it("should map the SOAP envelope", function () {
      const payload = { originatorData: { channel: "Online", appCatId: "App1" } };
      const result = mapRequest.mapEnvelope(payload);
      expect(result).to.have.property("IsEnvelope", true);
      expect(result.envelope).to.have.property("Header");
      expect(result.envelope.Header).to.have.property("bmoHdrRq");
    });
  });

  describe("mapForeignIndiciaList", function () {
    it("should map foreign indicia list using mapperHelper with all relevant properties", function () {
      const data = { 
        foreignIndicia: [
          { 
            action: "ADD", 
            foreignTaxCountry: "US",
            sourceObjectRef: [{ 
              objectRef: [{ 
                refKeyUser: "testUser",
                refKeyValue: "identifierValue"
              }]
            }],
            lastMaintainedDate: "2023-10-30T12:34:56.789Z",
            informationCollectedTimestamp: "2023-10-30T12:34:56.789Z",
            transitNumber: "1234",
            foreignTaxIdentifier: "ID-123",
            classificationScheme: "Scheme1",
            foreignTaxCountry: "US",
            owningIprt: "OwnIPRT",
            informationCollectorId: "CollectorID",
            informationCollectorName: "CollectorName"
          }
        ]
      };

      const result = mapRequest.mapForeignIndiciaList(data);
      expect(result).to.have.property("IsForeignIndiciaList", true);

      const mappedIndicia = result.foreignIndiciaData.AmendForeignIndicia[0];
      expect(mappedIndicia).to.have.property("Action", "ADD");

      const foreignIndiciaDetails = mappedIndicia.ForeignIndicia;
      expect(foreignIndiciaDetails).to.have.property("TransitNumber", "1234");
      expect(foreignIndiciaDetails).to.have.property("ForeignTaxCountry", "US");
      expect(foreignIndiciaDetails).to.have.property("ForeignTaxIdentifier", "ID-123");
      expect(foreignIndiciaDetails).to.have.property("ClassificationScheme", "Scheme1");
      expect(foreignIndiciaDetails).to.have.property("OwningIPRT", "OwnIPRT");
      expect(foreignIndiciaDetails).to.have.property("InformationCollectorID", "CollectorID");
      expect(foreignIndiciaDetails).to.have.property("InformationCollectorName", "CollectorName");

      // RecordAudit and nested details
      expect(foreignIndiciaDetails).to.have.property("RecordAudit");
      expect(foreignIndiciaDetails.RecordAudit).to.have.property("LastMaintainedUser").that.includes({ userID: "testUser" });
      expect(foreignIndiciaDetails).to.have.property("ObjectIdentifier", "identifierValue");
    });
  });

  describe("mapForeignTaxTrustList", function () {
    it("should map foreign tax trust list using mapperHelper", function () {
      const data = {
        foreignTaxTrust: [
          {
            action: "ADD",
            sourceObjectRef: [{ objectRef: [{ refKeyUser: "testUser", refKeyValue: "identifierValue" }] }],
            lastMaintainedDate: "2023-10-30T12:34:56.789Z",
            trustAccountNumber: "TRUST-123",
            systemIdentificationCode: "SYS-456",
            preexistingProfile: true,
            preexistingProfileCrs: true,
            taxAccountClassCrs: "ClassCrs",
            taxAccountClass: "Class",
            taxEntityClass: "EntityClass",
            indiciaCheckComplete: true,
            owningSldp: "OwningSLDP"
          }
        ]
      };

      const result = mapRequest.mapForeignTaxTrustList(data);
      expect(result).to.have.property("IsForeignTaxTrust", true);
      expect(result.foreignTaxTrustData).to.have.property("AmendForeignTaxTrust").that.is.an("array");

      const mappedTrust = result.foreignTaxTrustData.AmendForeignTaxTrust[0];
      expect(mappedTrust).to.have.property("Action", "ADD");

      const trustDetails = mappedTrust.ForeignTaxTrust;
      expect(trustDetails).to.have.property("TrustAccountNumber", "TRUST-123");
      expect(trustDetails).to.have.property("SystemIdentificationCode", "SYS-456");
      expect(trustDetails).to.have.property("PreexistingProfile", true);
      expect(trustDetails).to.have.property("PreexistingProfileCRS", true);
      expect(trustDetails).to.have.property("TaxAccountClassCRS", "ClassCrs");
      expect(trustDetails).to.have.property("TaxAccountClass", "Class");
      expect(trustDetails).to.have.property("TaxEntityClass", "EntityClass");
      expect(trustDetails).to.have.property("IndiciaCheckComplete", true);
      expect(trustDetails).to.have.property("OwningSLDP", "OwningSLDP");

      // Check nested RecordAudit and LastMaintainedUser
      expect(trustDetails).to.have.property("RecordAudit");
      expect(trustDetails.RecordAudit).to.have.property("LastMaintainedUser").that.includes({ userID: "testUser" });
      expect(trustDetails).to.have.property("ObjectIdentifier", "identifierValue");
    });

    it("should return IsForeignTaxTrust as false if foreignTaxTrust is empty", function () {
      const data = { foreignTaxTrust: [] };
      const result = mapRequest.mapForeignTaxTrustList(data);
      expect(result).to.have.property("IsForeignTaxTrust", false);
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
      expect(result).to.have.property("rootNS").that.is.a("string");

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

      const injectNamespaceStub = sinon.stub(mapRequest, "_injectNamespace").returns({ injected: "value" });
      const result = await mapRequest.injectPayloadNamespace(templateFilename, payload);

      expect(result).to.have.property("xmlnsAttributes").that.deep.includes({ name: "xmlns:cached", value: "http://cachednamespace" });
      expect(result).to.have.property("rootNS", "cachedRootNS");
      injectNamespaceStub.restore();
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
  });
});
