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

const _injectNamespace = (template, payload) => {
  let result = {};

  if(!template || !payload) return result;

  for (let [key, value] of Object.entries(template)) {
    let curKey = key.split(":")[1];

    if (Object.keys(payload).includes(curKey)) {
      if (Array.isArray(payload[curKey])) {
        result[key] = [];
        payload[curKey].forEach(elem => {
          result[key].push(_injectNamespace(value[0], elem));
        });
      }
      else if (typeof payload[curKey] === "object") {
        result[key] = _injectNamespace(value[0], payload[curKey]);
      }
      else {
        result[key] = payload[curKey];
      }
    }
  }
  
  return result;
};

describe("mapRequest.js", function () {
  describe("amendInvolvedParty_OCIFtoCG", function () {
    it("should map the payload correctly", async function () {
      const payload = { originatorData: { country: "US" }, identifier: { id: "12345" } };
      const result = await mapRequest.amendInvolvedParty_OCIFtoCG(payload);
      expect(result).to.be.a("string");
    });
  });

  describe("amendInvolvedParty_OCIFtoCG Error Handling", function () {
    it("should handle errors and call logError", async function () {
      const payload = { identifier: { id: "12345" } };
      sinon.stub(mapRequest, "mapEnvelope").throws(new Error("Simulated Error"));
      
      try {
        await mapRequest.amendInvolvedParty_OCIFtoCG(payload);
      } catch (error) {
        expect(logErrorStub.calledOnce).to.be.true;
        expect(logErrorStub.calledWith("error mapping amendInvolvedParty Response")).to.be.true;
      }
      
      mapRequest.mapEnvelope.restore();
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

  describe("mapSoapHeader", function () {
    it("should map the SOAP header based on originator data", function () {
      const originatorData = { channel: "Web", appCatId: "App1", country: "CA" };
      const result = mapRequest.mapSoapHeader(originatorData);
      expect(result).to.have.property("IsHeader", true);
      expect(result.header.Header).to.have.property("bmoHdrRq");
    });
  });

  describe("mapSoapBody", function () {
    it("should map the SOAP body including input header and input body", function () {
      const payload = { identifier: { id: "12345" } };
      const result = mapRequest.mapSoapBody(payload);
      expect(result).to.have.property("IsSoapBody", true);
      expect(result.soapBody.Body).to.have.property("AmendInvolvedPartyRequest");
    });
  });

  describe("mapAmendInvolvedPartyInputHeader", function () {
    it("should map the input header correctly", function () {
      const result = mapRequest.mapAmendInvolvedPartyInputHeader();
      expect(result).to.have.property("IsInputHeader", true);
      expect(result.inputHeader.AmendInvolvedPartyInputHeader).to.have.property("BusinessUnitCode", "BB");
    });
  });

  describe("mapInvolvedPartyIdentifier", function () {
    it("should map the involved party identifier", function () {
      const payload = { identifier: { id: "12345" } };
      const result = mapRequest.mapInvolvedPartyIdentifier(payload);
      expect(result).to.deep.equal({
        IsPartyIdentifier: true,
        partyIdentifierObj: { InvolvedPartyIdentifier: "12345" }
      });
    });
  });

  describe("mapForeignIndiciaList", function () {
    it("should map foreign indicia list using mapperHelper with relevant properties", function () {
      const data = {
        foreignIndicia: [
          {
            action: "ADD",
            foreignTaxCountry: "US",
            sourceObjectRef: [
              {
                objectRef: [
                  {
                    refKeyUser: "testUser",
                    refKeyValue: "identifierValue",
                  },
                ],
              },
            ],
            lastMaintainedDate: "2023-10-30T12:34:56.789Z",
            informationCollectedTimestamp: "2023-10-30T12:34:56.789Z",
            transitNumber: "1234",
            foreignTaxIdentifier: "ID-123",
            classificationScheme: "Scheme1",
            owningIprt: "OwnIPRT",
            informationCollectorId: "CollectorID",
            informationCollectorName: "CollectorName",
          },
        ],
      };
  
      const result = mapRequest.mapForeignIndiciaList(data);
  
      expect(result).to.have.property("IsForeignIndiciaList", true);
      expect(result.foreignIndiciaData).to.have.property("AmendForeignIndicia").that.is.an("array");
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
    });
  });
  
describe("injectPayloadNamespace", function () {
  let templateFilename, payload;

  beforeEach(() => {
    templateFilename = "testTemplate.xml";
    payload = { sampleKey: "sampleValue" };

    // Manually set the cache before each test case
    mapRequest.SOAPTemplateCache = {
      [templateFilename]: {
        template: { cachedKey: "cachedValue" },
        xmlnsAttributes: [{ name: "xmlns:cached", value: "http://cachednamespace" }],
        rootNS: "cachedRootNS",
      }
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should parse and cache the template when SOAPTemplateCache is empty", async function () {
    // Clear the cache to simulate an empty cache scenario
    mapRequest.SOAPTemplateCache = {};

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
    const injectNamespaceSpy = sinon.spy(mapRequest, "_injectNamespace");

    const result = await mapRequest.injectPayloadNamespace(templateFilename, payload);

    // Confirm that the cached data is returned without calling parseStringPromise
    expect(result.xmlnsAttributes).to.deep.include({ name: "xmlns:cached", value: "http://cachednamespace" });
    expect(result.rootNS).to.equal("cachedRootNS");

    // Ensure _injectNamespace was called (indicating cache usage)
    expect(injectNamespaceSpy.called).to.be.true;
    injectNamespaceSpy.restore();
  });

  it("should throw an error if template parsing fails", async function () {
    // Clear cache to trigger parsing and test error handling
    mapRequest.SOAPTemplateCache = {};

    const parseStringPromiseStub = sinon.stub(xml2js, "parseStringPromise").rejects(new Error("Parsing Error"));
    await expect(mapRequest.injectPayloadNamespace(templateFilename, payload)).to.be.rejectedWith("Parsing Error");
    parseStringPromiseStub.restore();
  });
});

  describe("mapForeignSupportDocumentList", function () {
    it("should map foreign support document list using mapperHelper", function () {
      const data = { foreignSupportDocument: [{ action: "ADD", documentStatus: "Verified" }] };
      const result = mapRequest.mapForeignSupportDocumentList(data);
      expect(result).to.have.property("IsForeignSupportDocument", true);
    });
  });

  describe("mapForeignTaxEntityObj", function () {
    it("should map foreign tax entity object correctly", function () {
      const data = { foreignTaxEntity: { action: "UPDATE", canadianTaxResident: true } };
      const result = mapRequest.mapForeignTaxEntityObj(data);
      expect(result).to.have.property("IsForeignTaxEntityObj", true);
    });
  });

  describe("mapForeignTaxIndividualObj", function () {
    it("should map foreign tax individual object correctly", function () {
      const data = { foreignTaxIndividual: { action: "DELETE", usCitizen: true } };
      const result = mapRequest.mapForeignTaxIndividualObj(data);
      expect(result).to.have.property("IsForeignTaxIndividual", true);
    });
  });

  describe("mapForeignTaxCountryList", function () {
    it("should map foreign tax country list using mapperHelper", function () {
      const data = { foreignTaxCountry: [{ action: "ADD", foreignTaxStatusType: "Active" }] };
      const result = mapRequest.mapForeignTaxCountryList(data);
      expect(result).to.have.property("IsForeignTaxCountry", true);
    });
  });

  describe("mapForeignTaxRoleList", function () {
    it("should map foreign tax role list correctly", function () {
      const data = { foreignTaxRole: [{ action: "ADD", usCitizen: true }] };
      const result = mapRequest.mapForeignTaxRoleList(data);
      expect(result).to.have.property("IsForeignTaxRole", true);
    });
  });
});
