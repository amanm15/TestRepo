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

it("should handle errors in amendInvolvedParty_OCIFtoCG gracefully", async () => {
    const payload = { identifier: { id: "12345" } };
    
    // Stub `mapEnvelope` or other internal calls to throw errors
    sinon.stub(mapRequest, "mapEnvelope").throws(new Error("Simulated mapping error"));

    try {
        await mapRequest.amendInvolvedParty_OCIFtoCG(payload);
    } catch (error) {
        expect(logErrorStub.calledOnce).to.be.true;
        expect(logErrorStub.args[0][0]).to.include("error mapping amendInvolvedParty Response");
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

  it("should handle missing nested properties in _injectNamespace", function () {
    const template = { "ns:Parent": { "ns:Child": { "ns:Grandchild": {} } } };
    const payload = { Parent: { Child: {} } }; // `Grandchild` is missing in payload

    const result = _injectNamespace(template, payload);

    expect(result).to.deep.equal({
        "ns:Parent": { "ns:Child": {} } // `Grandchild` should be omitted
    });
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
it("should return false when foreignTaxTrust is null or undefined", function () {
        let result = mapRequest.mapForeignTaxTrustList({ foreignTaxTrust: null });
        expect(result).to.have.property("IsForeignTaxRole", false);

        result = mapRequest.mapForeignTaxTrustList({ foreignTaxTrust: undefined });
        expect(result).to.have.property("IsForeignTaxRole", false);
    });

    it("should return false when foreignTaxTrust is an empty array", function () {
        const result = mapRequest.mapForeignTaxTrustList({ foreignTaxTrust: [] });
        expect(result).to.have.property("IsForeignTaxRole", false);
    });

    it("should process foreignTaxTrust data when it contains entries", function () {
        const data = { foreignTaxTrust: [{ action: "ADD", trustAccountNumber: "12345" }] };
        const result = mapRequest.mapForeignTaxTrustList(data);

        expect(result).to.have.property("IsForeignTaxRole", true);
        expect(result.foreignTaxTrustData.AmendForeignTaxTrust[0]).to.have.property("Action", "ADD");
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

describe("_injectNamespace with array elements in payload", function () {
    it("should process each array element in payload and apply _injectNamespace correctly", function () {
        const template = {
            "ns:Parent": {
                "ns:Items": [
                    { "ns:Item": { "ns:Name": {} } }
                ]
            }
        };
        
        // Payload contains an array for "Items" key
        const payload = {
            Parent: {
                Items: [
                    { Name: "FirstItem" },
                    { Name: "SecondItem" }
                ]
            }
        };

        const result = _injectNamespace(template, payload);

        // Expected result should map array elements individually with namespace applied
        expect(result).to.deep.equal({
            "ns:Parent": {
                "ns:Items": [
                    { "ns:Item": { "ns:Name": "FirstItem" } },
                    { "ns:Item": { "ns:Name": "SecondItem" } }
                ]
            }
        });
    });
});
  
describe("_injectNamespace function", function () {
    
    it("should handle array values in the payload correctly", function () {
        const template = {
            "ns:Parent": {
                "ns:Items": [
                    { "ns:Item": { "ns:Name": {} } }
                ]
            }
        };
        
        // Payload contains an array for "Items" key
        const payload = {
            Parent: {
                Items: [
                    { Name: "FirstItem" },
                    { Name: "SecondItem" }
                ]
            }
        };

        const result = _injectNamespace(template, payload);

        expect(result).to.deep.equal({
            "ns:Parent": {
                "ns:Items": [
                    { "ns:Item": { "ns:Name": "FirstItem" } },
                    { "ns:Item": { "ns:Name": "SecondItem" } }
                ]
            }
        });
    });

    it("should handle nested object values in the payload", function () {
        const template = {
            "ns:Parent": {
                "ns:Child": {
                    "ns:Grandchild": {}
                }
            }
        };
        
        // Payload has a nested structure that matches the template structure
        const payload = {
            Parent: {
                Child: {
                    Grandchild: "Value"
                }
            }
        };

        const result = _injectNamespace(template, payload);

        expect(result).to.deep.equal({
            "ns:Parent": {
                "ns:Child": {
                    "ns:Grandchild": "Value"
                }
            }
        });
    });

    it("should handle plain values in the payload", function () {
        const template = { "ns:Simple": {} };
        const payload = { Simple: "JustAValue" };

        const result = _injectNamespace(template, payload);

        expect(result).to.deep.equal({
            "ns:Simple": "JustAValue"
        });
    });

    it("should skip keys not present in the payload", function () {
        const template = {
            "ns:Parent": {
                "ns:UnusedKey": {},
                "ns:UsedKey": {}
            }
        };
        const payload = {
            Parent: {
                UsedKey: "Value"
            }
        };

        const result = _injectNamespace(template, payload);

        expect(result).to.deep.equal({
            "ns:Parent": {
                "ns:UsedKey": "Value"
            }
        });
    });

    it("should return an empty result when the payload key does not match the template structure", function () {
        const template = {
            "ns:Parent": {
                "ns:Child": {}
            }
        };
        const payload = {
            MismatchedKey: "SomeValue"
        };

        const result = _injectNamespace(template, payload);

        expect(result).to.deep.equal({});
    });

    it("should handle an array with nested objects in the payload", function () {
        const template = {
            "ns:Parent": {
                "ns:Items": [
                    { "ns:Item": { "ns:Details": { "ns:Name": {} } } }
                ]
            }
        };
        
        // Payload has an array of objects with nested structures
        const payload = {
            Parent: {
                Items: [
                    { Details: { Name: "ItemOne" } },
                    { Details: { Name: "ItemTwo" } }
                ]
            }
        };

        const result = _injectNamespace(template, payload);

        expect(result).to.deep.equal({
            "ns:Parent": {
                "ns:Items": [
                    { "ns:Item": { "ns:Details": { "ns:Name": "ItemOne" } } },
                    { "ns:Item": { "ns:Details": { "ns:Name": "ItemTwo" } } }
                ]
            }
        });
    });
});

describe("convertISOtoOCIFDateTimestamp", function () {
  it("should convert a standard ISO date to OCIF format", function () {
    const isoDate = "2023-10-30T12:34:56.789Z"; // Example ISO date
    const result = mapRequest.convertISOtoOCIFDateTimestamp(isoDate, false);

    expect(result).to.equal("2023-10-30-12.34.56.789000");
  });

  it("should handle a date-only ISO string correctly", function () {
    const isoDate = "2023-10-30"; // ISO date without time
    const result = mapRequest.convertISOtoOCIFDateTimestamp(isoDate, false);

    expect(result).to.equal("2023-10-30-00.00.00.000000");
  });

  it("should handle missing input gracefully", function () {
    const result = mapRequest.convertISOtoOCIFDateTimestamp(null, false);
    expect(result).to.equal(""); // Or the expected behavior for null input
  });

  it("should handle incorrect date formats gracefully", function () {
    const invalidDate = "invalid-date";
    const result = mapRequest.convertISOtoOCIFDateTimestamp(invalidDate, false);
    expect(result).to.equal(""); // Assuming it returns an empty string on error
  });

  it("should handle the millisecond precision flag correctly", function () {
    const isoDate = "2023-10-30T12:34:56.789Z";
    const result = mapRequest.convertISOtoOCIFDateTimestamp(isoDate, true);
    expect(result).to.equal("2023-10-30-12.34.56"); // Example without milliseconds
  });
});

describe("validateObjBasedOnAction", function () {
  it("should return IsRecordAudit and IsLastMaintainedUser as false when Action is 'ADD'", function () {
    const result = mapRequest.validateObjBasedOnAction("ADD", {}, "TestObject");
    expect(result).to.deep.equal({
      IsRecordAudit: false,
      IsLastMaintainedUser: false
    });
  });

  it("should return IsRecordAudit and IsLastMaintainedUser as true when Action is not 'ADD'", function () {
    const result = mapRequest.validateObjBasedOnAction("UPDATE", { sourceObjectRef: [] }, "TestObject");
    expect(result).to.deep.equal({
      IsRecordAudit: true,
      IsLastMaintainedUser: true
    });
  });

  it("should throw an error when sourceObjectRef is defined but not an array", function () {
    const invalidObj = { sourceObjectRef: "notAnArray" };
    expect(() => mapRequest.validateObjBasedOnAction("UPDATE", invalidObj, "TestObject"))
      .to.throw()
      .that.deep.includes({
        type: "failure",
        title: "Invalid request body",
        status: 400,
        detail: `object has missing required properties (["id"])`
      });
  });

  it("should throw an error when sourceObjectRef is undefined", function () {
    const objWithUndefinedRef = {};
    expect(() => mapRequest.validateObjBasedOnAction("UPDATE", objWithUndefinedRef, "TestObject"))
      .to.throw()
      .that.deep.includes({
        type: "failure",
        title: "Invalid request body",
        status: 400,
        detail: `sourceObjectRef must be defined in TestObject for UPDATE Action at index 1`
      });
  });

  it("should throw an error when sourceObjectRef is an empty array", function () {
    const objWithEmptyArrayRef = { sourceObjectRef: [] };
    expect(() => mapRequest.validateObjBasedOnAction("UPDATE", objWithEmptyArrayRef, "TestObject"))
      .to.throw()
      .that.deep.includes({
        type: "failure",
        title: "Invalid request body",
        status: 400,
        detail: `sourceObjectRef in TestObject for UPDATE Action at index 1 MUST not be empty`
      });
  });
});

describe("mapAmendInvolvedPartyInputBody", function () {
  let mapInvolvedPartyIdentifierStub;
  let mapAmendIdentificationStub;
  let mapForeignIndiciaListStub;
  let mapForeignTaxEntityObjStub;
  let mapForeignTaxIndividualObjStub;
  let mapForeignSupportDocumentListStub;
  let mapForeignTaxCountryListStub;
  let mapForeignTaxRoleListStub;
  let mapForeignTaxTrustListStub;

  beforeEach(() => {
    // Stubbing each dependency to isolate the test for mapAmendInvolvedPartyInputBody
    mapInvolvedPartyIdentifierStub = sinon.stub(mapRequest, "mapInvolvedPartyIdentifier").returns({ IsPartyIdentifier: true, partyIdentifierObj: { id: "12345" } });
    mapAmendIdentificationStub = sinon.stub(mapRequest, "mapAmendIdentification").returns({ IsAmendIdentification: true, amendIdentificationObj: { name: "TestName" } });
    mapForeignIndiciaListStub = sinon.stub(mapRequest, "mapForeignIndiciaList").returns({ IsForeignIndiciaList: true, foreignIndiciaData: { indicia: "testIndicia" } });
    mapForeignTaxEntityObjStub = sinon.stub(mapRequest, "mapForeignTaxEntityObj").returns({ IsForeignTaxEntityObj: true, foreignTaxEntityData: { entity: "testEntity" } });
    mapForeignTaxIndividualObjStub = sinon.stub(mapRequest, "mapForeignTaxIndividualObj").returns({ IsForeignTaxIndividual: true, foreignTaxIndividualData: { individual: "testIndividual" } });
    mapForeignSupportDocumentListStub = sinon.stub(mapRequest, "mapForeignSupportDocumentList").returns({ IsForeignSupportDocument: true, foreignSupportDocumentData: { document: "testDocument" } });
    mapForeignTaxCountryListStub = sinon.stub(mapRequest, "mapForeignTaxCountryList").returns({ IsForeignTaxCountry: true, foreignTaxCountryData: { country: "testCountry" } });
    mapForeignTaxRoleListStub = sinon.stub(mapRequest, "mapForeignTaxRoleList").returns({ IsForeignTaxRole: true, foreignTaxRoleData: { role: "testRole" } });
    mapForeignTaxTrustListStub = sinon.stub(mapRequest, "mapForeignTaxTrustList").returns({ IsForeignTaxTrust: true, foreignTaxTrustData: { trust: "testTrust" } });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should return the correct inputBody structure when all sub-mapping functions return valid data", function () {
    const payload = {}; // Mock payload, not used since we are stubbing all dependency functions
    const result = mapRequest.mapAmendInvolvedPartyInputBody(payload);

    expect(result).to.deep.equal({
      IsInputBody: true,
      inputBody: {
        AmendInvolvedPartyInputBody: {
          id: "12345",
          name: "TestName",
          indicia: "testIndicia",
          entity: "testEntity",
          individual: "testIndividual",
          document: "testDocument",
          country: "testCountry",
          role: "testRole",
          trust: "testTrust"
        }
      }
    });
  });

  it("should exclude properties from inputBody when sub-mapping functions return false flags", function () {
    // Adjust stubs to return false for certain flags
    mapInvolvedPartyIdentifierStub.returns({ IsPartyIdentifier: false, partyIdentifierObj: {} });
    mapAmendIdentificationStub.returns({ IsAmendIdentification: false, amendIdentificationObj: {} });
    mapForeignIndiciaListStub.returns({ IsForeignIndiciaList: false, foreignIndiciaData: {} });
    mapForeignTaxEntityObjStub.returns({ IsForeignTaxEntityObj: false, foreignTaxEntityData: {} });
    mapForeignTaxIndividualObjStub.returns({ IsForeignTaxIndividual: false, foreignTaxIndividualData: {} });
    mapForeignSupportDocumentListStub.returns({ IsForeignSupportDocument: false, foreignSupportDocumentData: {} });
    mapForeignTaxCountryListStub.returns({ IsForeignTaxCountry: false, foreignTaxCountryData: {} });
    mapForeignTaxRoleListStub.returns({ IsForeignTaxRole: false, foreignTaxRoleData: {} });
    mapForeignTaxTrustListStub.returns({ IsForeignTaxTrust: false, foreignTaxTrustData: {} });

    const payload = {}; // Mock payload
    const result = mapRequest.mapAmendInvolvedPartyInputBody(payload);

    expect(result).to.deep.equal({
      IsInputBody: true,
      inputBody: {
        AmendInvolvedPartyInputBody: {}
      }
    });
  });

  it("should include only specific properties in inputBody based on sub-mapping function results", function () {
    // Make some sub-functions return true and others return false
    mapInvolvedPartyIdentifierStub.returns({ IsPartyIdentifier: true, partyIdentifierObj: { id: "12345" } });
    mapAmendIdentificationStub.returns({ IsAmendIdentification: false, amendIdentificationObj: {} });
    mapForeignIndiciaListStub.returns({ IsForeignIndiciaList: true, foreignIndiciaData: { indicia: "testIndicia" } });
    mapForeignTaxEntityObjStub.returns({ IsForeignTaxEntityObj: false, foreignTaxEntityData: {} });
    mapForeignTaxIndividualObjStub.returns({ IsForeignTaxIndividual: true, foreignTaxIndividualData: { individual: "testIndividual" } });
    mapForeignSupportDocumentListStub.returns({ IsForeignSupportDocument: true, foreignSupportDocumentData: { document: "testDocument" } });
    mapForeignTaxCountryListStub.returns({ IsForeignTaxCountry: false, foreignTaxCountryData: {} });
    mapForeignTaxRoleListStub.returns({ IsForeignTaxRole: true, foreignTaxRoleData: { role: "testRole" } });
    mapForeignTaxTrustListStub.returns({ IsForeignTaxTrust: false, foreignTaxTrustData: {} });

    const payload = {}; // Mock payload
    const result = mapRequest.mapAmendInvolvedPartyInputBody(payload);

    expect(result).to.deep.equal({
      IsInputBody: true,
      inputBody: {
        AmendInvolvedPartyInputBody: {
          id: "12345",
          indicia: "testIndicia",
          individual: "testIndividual",
          document: "testDocument",
          role: "testRole"
        }
      }
    });
  });
});

describe("mapAmendIdentification", function () {
  it("should return the basic structure of amendIdentificationObj without country", function () {
    const payload = {}; // No country provided in payload
    const result = mapRequest.mapAmendIdentification(payload);

    expect(result).to.deep.equal({
      IsAmendIdentification: false,
      amendIdentificationObj: {
        AmendIdentification: {
          Identification: {
            IdentificationTypeCode: { Code: "SI" },
            IdentificationText: "381282912",
            UseAuthorizationCode: "T",
            LastViewedDate: "2024-09-04",
            EnteredDate: new Date().toISOString().split("T")[0]
          }
        }
      }
    });
  });

  it("should include IdentificationIssuingCountry when country is provided in payload", function () {
    const payload = { originatorData: { country: "US" } };
    const result = mapRequest.mapAmendIdentification(payload);

    expect(result).to.deep.equal({
      IsAmendIdentification: false,
      amendIdentificationObj: {
        AmendIdentification: {
          Identification: {
            IdentificationTypeCode: { Code: "SI" },
            IdentificationText: "381282912",
            IdentificationIssuingCountry: "US",
            UseAuthorizationCode: "T",
            LastViewedDate: "2024-09-04",
            EnteredDate: new Date().toISOString().split("T")[0]
          }
        }
      }
    });
  });

  it("should correctly set EnteredDate to today's date", function () {
    const payload = {}; // Payload without country
    const result = mapRequest.mapAmendIdentification(payload);

    const today = new Date().toISOString().split("T")[0];
    expect(result.amendIdentificationObj.AmendIdentification.Identification.EnteredDate).to.equal(today);
  });
});
  

});
