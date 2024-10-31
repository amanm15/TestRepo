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
    
    // Validate the structure
    expect(result).to.have.property("IsForeignTaxRole", true);
    expect(result.foreignTaxTrustData).to.have.property("AmendForeignTaxTrust").that.is.an("array");

    const mappedTrust = result.foreignTaxTrustData.AmendForeignTaxTrust[0];
    expect(mappedTrust).to.have.property("Action", "ADD");

    // Validate properties mapped by mapperHelper
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

    // Check for nested RecordAudit and LastMaintainedUser mapping
    expect(trustDetails).to.have.property("RecordAudit");
    expect(trustDetails.RecordAudit).to.have.property("LastMaintainedUser").that.includes({
      userID: "testUser"
    });
    expect(trustDetails).to.have.property("ObjectIdentifier", "identifierValue");
  });

  it("should return IsForeignTaxRole as false if foreignTaxTrust is empty", function () {
    const data = { foreignTaxTrust: [] };
    const result = mapRequest.mapForeignTaxTrustList(data);
    expect(result).to.have.property("IsForeignTaxRole", false);
  });
});


describe("injectPayloadNamespace", function () {
  let templateFilename, payload;

  beforeEach(() => {
    // Reset the cache and initialize variables before each test
    mapRequest.__set__("SOAPTemplateCache", {}); // Clear cache (depends on your testing framework for resetting private variables)
    templateFilename = "testTemplate.xml";
    payload = { someKey: "someValue" };
  });

  it("should use cached template if available in SOAPTemplateCache", async function () {
    // Setup: Populate SOAPTemplateCache with mock data
    mapRequest.__set__("SOAPTemplateCache", {
      [templateFilename]: {
        template: { mockTemplateKey: "mockTemplateValue" },
        xmlnsAttributes: [{ name: "xmlns:mock", value: "http://mocknamespace" }],
        rootNS: "mockRootNS"
      }
    });

    // Act: Call the function
    const result = await mapRequest.injectPayloadNamespace(templateFilename, payload);

    // Assertions: Check if cached values were used
    expect(result).to.have.property("payloadWithNS").that.is.an("object");
    expect(result).to.have.property("xmlnsAttributes").that.is.an("array").with.lengthOf(1);
    expect(result.xmlnsAttributes[0]).to.include({ name: "xmlns:mock", value: "http://mocknamespace" });
    expect(result).to.have.property("rootNS", "mockRootNS");
  });

  it("should retrieve and parse template when not cached", async function () {
    // Mock for case where the template is not cached
    const parseStringPromiseStub = sinon.stub(require("xml2js"), "parseStringPromise").resolves({
      "soapenv:Envelope": {
        "$": { "xmlns:mock": "http://mocknamespace" },
        "soapenv:Body": [{ "mockRequest": [{ mockElement: "mockValue" }] }]
      }
    });

    const result = await mapRequest.injectPayloadNamespace(templateFilename, payload);

    // Assertions to confirm parseStringPromise was called
    expect(parseStringPromiseStub.calledOnce).to.be.true;
    parseStringPromiseStub.restore(); // Clean up stub
  });
});
