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


describe("mapForeignIndiciaList", function () {
  it("should return IsForeignIndiciaList as false when foreignIndicia is empty", function () {
    const data = { foreignIndicia: [] };
    const result = mapRequest.mapForeignIndiciaList(data);
    expect(result.IsForeignIndiciaList).to.be.false;
  });
  
  it("should handle undefined foreignIndicia", function () {
    const data = { foreignIndicia: undefined };
    const result = mapRequest.mapForeignIndiciaList(data);
    expect(result.IsForeignIndiciaList).to.be.false;
  });

  it("should map foreignIndicia array with ADD and DELETE actions", function () {
    const data = {
      foreignIndicia: [
        { action: "ADD", foreignTaxCountry: "US" },
        { action: "DELETE", foreignTaxCountry: "CA" }
      ]
    };
    const result = mapRequest.mapForeignIndiciaList(data);
    expect(result.IsForeignIndiciaList).to.be.true;
    expect(result.foreignIndiciaData.AmendForeignIndicia).to.have.lengthOf(2);
  });
});


describe("mapForeignTaxTrustList", function () {
  it("should return IsForeignTaxRole as false for empty foreignTaxTrust", function () {
    const data = { foreignTaxTrust: [] };
    const result = mapRequest.mapForeignTaxTrustList(data);
    expect(result.IsForeignTaxRole).to.be.false;
  });

  it("should handle undefined foreignTaxTrust", function () {
    const data = { foreignTaxTrust: undefined };
    const result = mapRequest.mapForeignTaxTrustList(data);
    expect(result.IsForeignTaxRole).to.be.false;
  });

  it("should map multiple entries in foreignTaxTrust with various actions", function () {
    const data = {
      foreignTaxTrust: [
        { action: "ADD", trustAccountNumber: "12345" },
        { action: "DELETE", trustAccountNumber: "67890" }
      ]
    };
    const result = mapRequest.mapForeignTaxTrustList(data);
    expect(result.IsForeignTaxRole).to.be.true;
    expect(result.foreignTaxTrustData.AmendForeignTaxTrust).to.have.lengthOf(2);
  });
});


describe("_injectNamespace", function () {
  it("should return an empty object for empty template and payload", function () {
    const template = {};
    const payload = {};
    const result = mapRequest._injectNamespace(template, payload);
    expect(result).to.deep.equal({});
  });

  it("should handle nested object values in the payload", function () {
    const template = { "ns:Parent": { "ns:Child": { "ns:Grandchild": {} } } };
    const payload = { Parent: { Child: { Grandchild: "Value" } } };
    const result = mapRequest._injectNamespace(template, payload);
    expect(result).to.deep.equal({
      "ns:Parent": { "ns:Child": { "ns:Grandchild": "Value" } },
    });
  });

  it("should handle array values in the payload", function () {
    const template = { "ns:Items": [{ "ns:Item": { "ns:Name": {} } }] };
    const payload = { Items: [{ Name: "Item1" }, { Name: "Item2" }] };
    const result = mapRequest._injectNamespace(template, payload);
    expect(result).to.deep.equal({
      "ns:Items": [
        { "ns:Item": { "ns:Name": "Item1" } },
        { "ns:Item": { "ns:Name": "Item2" } },
      ],
    });
  });
});


describe("mapEnvelope Partial Properties", function () {
  it("should handle missing properties in originatorData", function () {
    const payload = { originatorData: { channel: "Online" } };
    const result = mapRequest.mapEnvelope(payload);
    expect(result.envelope.Header.bmoHdrRq).to.have.property("channel", "Online");
    expect(result.envelope).not.to.have.property("Body");
  });
});
