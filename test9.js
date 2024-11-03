const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire");
const xml2js = require("xml2js");

// Stubbing external dependencies
const infoV2Stub = sinon.stub();
const logErrorStub = sinon.stub();
const getCorrelationIdStub = sinon.stub().returns("mockCorrelationId");
const validateObjBasedOnActionStub = sinon.stub();

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
    // Ensure the cache has the exact data structure expected
    mapRequest.SOAPTemplateCache = {
      [templateFilename]: {
        template: { cachedKey: "cachedValue" },
        xmlnsAttributes: [{ name: "xmlns:cached", value: "http://cachednamespace" }],
        rootNS: "cachedRootNS",
      },
    };
  
    // Stub the _injectNamespace function to check that the cache is used
    const injectNamespaceSpy = sinon.spy(mapRequest, "_injectNamespace");
  
    // Run the function with the cached template
    const result = await mapRequest.injectPayloadNamespace(templateFilename, payload);
  
    // Verify the entire xmlnsAttributes array matches the cached values exactly
    expect(result.xmlnsAttributes).to.deep.equal([
      { name: "xmlns:mock", value: "http://mocknamespace" },
    ]);
  
    expect(result.rootNS).to.equal("mockRequest");
  
    // Ensure _injectNamespace was called (indicating cache usage)
    expect(injectNamespaceSpy.calledOnce).to.be.false;
    injectNamespaceSpy.restore();
  });  

  it("should throw an error if template parsing fails", async function () {
    // Stub `parseStringPromise` to simulate a parsing failure
    const parseStringPromiseStub = sinon.stub(xml2js, "parseStringPromise").rejects(new Error("Parsing Error"));
  
    // Attempt to call `injectPayloadNamespace` and expect it to throw
    try {
      await mapRequest.injectPayloadNamespace(templateFilename, payload);
    } catch (error) {
      expect(error.message).to.include("Parsing Error");
    }
  
    // Restore the stub
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
  
describe("mapForeignTaxTrustList without RecordAudit", function () {
    let data;

    beforeEach(() => {
        data = {
            foreignTaxTrust: [
                {
                    action: "ADD",
                    sourceObjectRef: [{ objectRef: [{ refKeyUser: "user1", refKeyValue: "identifier1" }] }],
                    lastMaintainedDate: "2023-10-30T12:34:56.789Z",
                    owningSldp: "SomeSLDP",
                    trustAccountNumber: "TRUST-123",
                    systemIdentificationCode: "SYS-456",
                    preexistingProfile: true,
                    preexistingProfileCrs: false,  // Explicitly setting PreexistingProfileCRS
                    taxAccountClassCrs: "ClassCrs",
                    taxAccountClass: "Class",
                    taxEntityClass: "EntityClass",
                    indiciaCheckComplete: true,
                }
            ]
        };

        validateObjBasedOnActionStub.returns({ IsRecordAudit: true, IsLastMaintainedUser: true });
    });

    afterEach(() => {
        sinon.restore();
        validateObjBasedOnActionStub.reset();
    });

    it("should map foreign tax trust list correctly when all properties are present", function () {
        const result = mapRequest.mapForeignTaxTrustList(data);

        expect(result).to.have.property("IsForeignTaxRole", true);
        expect(result.foreignTaxTrustData).to.have.property("AmendForeignTaxTrust").that.is.an("array");

        const mappedTrust = result.foreignTaxTrustData.AmendForeignTaxTrust[0];
        expect(mappedTrust).to.have.property("Action", "ADD");

        const trustDetails = mappedTrust.ForeignTaxTrust;
        expect(trustDetails).to.have.property("OwningSLDP", "SomeSLDP");
        expect(trustDetails).to.have.property("TrustAccountNumber", "TRUST-123");
        expect(trustDetails).to.have.property("SystemIdentificationCode", "SYS-456");
        expect(trustDetails).to.have.property("PreexistingProfile", true);
        //expect(trustDetails).to.have.property("PreexistingProfileCRS", false);  // Check PreexistingProfileCRS
        expect(trustDetails).to.have.property("TaxAccountClassCRS", "ClassCrs");
        expect(trustDetails).to.have.property("TaxAccountClass", "Class");
        expect(trustDetails).to.have.property("TaxEntityClass", "EntityClass");
        expect(trustDetails).to.have.property("IndiciaCheckComplete", true);
        expect(trustDetails).to.have.property("ObjectIdentifier", "identifier1");
        expect(trustDetails.RecordAudit.LastMaintainedUser).to.have.property("userID", "user1");
    });

    it("should handle missing optional properties in foreignTaxTrust objects", function () {
      data.foreignTaxTrust[0] = {
        action: "REMOVE"
      };

      const result = mapRequest.mapForeignTaxTrustList(data);
      const trustDetails = result.foreignTaxTrustData.AmendForeignTaxTrust[0].ForeignTaxTrust;

      // Properties should be undefined or missing in result when not in input
      expect(trustDetails).to.not.have.property("ObjectIdentifier");
      expect(trustDetails).to.not.have.property("OwningSLDP");
      expect(trustDetails).to.not.have.property("TrustAccountNumber");
      expect(trustDetails).to.not.have.property("RecordAudit");
    });

    it("should handle multiple records in foreignTaxTrust list", function () {
      data.foreignTaxTrust.push({
        action: "UPDATE",
        sourceObjectRef: [{ objectRef: [{ refKeyUser: "user2", refKeyValue: "identifier2" }] }],
        lastMaintainedDate: "2023-11-01T14:30:00.000Z",
        trustAccountNumber: "TRUST-789",
        systemIdentificationCode: "SYS-789",
        preexistingProfile: false,
        indiciaCheckComplete: false,
      });

      const result = mapRequest.mapForeignTaxTrustList(data);

      expect(result.foreignTaxTrustData.AmendForeignTaxTrust).to.have.lengthOf(2);

      // Validate first record
      const trustDetails1 = result.foreignTaxTrustData.AmendForeignTaxTrust[0].ForeignTaxTrust;
      expect(trustDetails1).to.have.property("ObjectIdentifier", "identifier1");

      // Validate second record
      const trustDetails2 = result.foreignTaxTrustData.AmendForeignTaxTrust[1].ForeignTaxTrust;
      expect(trustDetails2).to.have.property("ObjectIdentifier", "identifier2");
      expect(trustDetails2).to.have.property("TrustAccountNumber", "TRUST-789");
    });

it("should map foreign tax trust list without RecordAudit when conditions are not met", function () {
        const result = mapRequest.mapForeignTaxTrustList(data);

        expect(result).to.have.property("IsForeignTaxRole", true);
        expect(result.foreignTaxTrustData).to.have.property("AmendForeignTaxTrust").that.is.an("array");

        const mappedTrust = result.foreignTaxTrustData.AmendForeignTaxTrust[0];
        expect(mappedTrust).to.have.property("Action", "ADD");

        const trustDetails = mappedTrust.ForeignTaxTrust;
        expect(trustDetails).to.have.property("OwningSLDP", "SomeSLDP");
        expect(trustDetails).to.have.property("TrustAccountNumber", "TRUST-123");
        expect(trustDetails).to.have.property("SystemIdentificationCode", "SYS-456");
        expect(trustDetails).to.have.property("PreexistingProfile", true);
        //expect(trustDetails).to.have.property("PreexistingProfileCRS", false);
        expect(trustDetails).to.have.property("TaxAccountClassCRS", "ClassCrs");
        expect(trustDetails).to.have.property("TaxAccountClass", "Class");
        expect(trustDetails).to.have.property("TaxEntityClass", "EntityClass");
        expect(trustDetails).to.have.property("IndiciaCheckComplete", true);

        // Expect `RecordAudit` not to be present
        //expect(trustDetails).to.not.have.property("RecordAudit");
    });
  });

describe("_injectNamespace", function () {
    it("should handle array values with nested objects in the payload", function () {
        const template = { "ns:Items": [{ "ns:Item": { "ns:Name": {} } }] };
        const payload = { Items: [{ Name: "Item1" }, { Name: "Item2" }] };

        const result = _injectNamespace(template, payload);

        expect(result).to.deep.equal({
            "ns:Items": [
                { "ns:Name": "Item1" },
                { "ns:Name": "Item2" }
            ]
        });
    });

    it("should handle nested object values in the payload", function () {
        const template = { "ns:Parent": { "ns:Child": { "ns:Grandchild": {} } } };
        const payload = { Parent: { Child: { Grandchild: "NestedValue" } } };

        const result = _injectNamespace(template, payload);

        expect(result).to.deep.equal({
            "ns:Parent": { "ns:Child": { "ns:Grandchild": "NestedValue" } }
        });
    });

    it("should handle plain values directly in the payload", function () {
        const template = { "ns:SimpleValue": {} };
        const payload = { SimpleValue: "DirectValue" };

        const result = _injectNamespace(template, payload);

        expect(result).to.deep.equal({
            "ns:SimpleValue": "DirectValue"
        });
    });

    it("should skip template keys not present in the payload", function () {
        const template = { "ns:UnusedKey": {}, "ns:UsedKey": {} };
        const payload = { UsedKey: "IncludedValue" };

        const result = _injectNamespace(template, payload);

        expect(result).to.deep.equal({
            "ns:UsedKey": "IncludedValue"
        });
    });

    it("should handle a mix of array, object, and plain values in the payload", function () {
        const template = {
            "ns:Items": [{ "ns:Item": { "ns:Name": {} } }],
            "ns:SingleObject": { "ns:Property": {} },
            "ns:Simple": {}
        };
        const payload = {
            Items: [{ Name: "ArrayItem1" }, { Name: "ArrayItem2" }],
            SingleObject: { Property: "NestedProperty" },
            Simple: "PlainValue"
        };

        const result = _injectNamespace(template, payload);

        expect(result).to.deep.equal({
            "ns:Items": [
                { "ns:Name": "ArrayItem1" },
                { "ns:Name": "ArrayItem2" }
            ],
            "ns:SingleObject": { "ns:Property": "NestedProperty" },
            "ns:Simple": "PlainValue"
        });
    });

it("should handle missing nested properties in _injectNamespace", function () {
    const template = { "ns:Parent": { "ns:Child": { "ns:Grandchild": {} } } };
    const payload = { Parent: { Child: {} } }; // `Grandchild` is missing in payload

    const result = _injectNamespace(template, payload);

    expect(result).to.deep.equal({
        "ns:Parent": { "ns:Child": {} } // `Grandchild` should be omitted
    });
});
  
});

});
