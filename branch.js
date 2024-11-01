describe("amendInvolvedParty_OCIFtoCG", function () {
  it("should call logError on exception", async function () {
    const payload = { identifier: { id: "12345" } };
    sinon.stub(mapRequest, "mapEnvelope").throws(new Error("Test error"));
    
    try {
      await mapRequest.amendInvolvedParty_OCIFtoCG(payload);
    } catch (error) {
      expect(logErrorStub.calledWith("error mapping amendInvolvedParty Response", error)).to.be.true;
    }
    
    mapRequest.mapEnvelope.restore();
  });
});

describe("mapEnvelope", function () {
  it("should map envelope with only header", function () {
    const payload = { originatorData: { channel: "Online" } };
    const result = mapRequest.mapEnvelope(payload);
    
    expect(result).to.have.property("IsEnvelope", true);
    expect(result.envelope).to.have.property("Header");
    expect(result.envelope).not.to.have.property("Body");
  });
});

describe("mapForeignIndiciaList", function () {
  it("should return IsForeignIndiciaList false if foreignIndicia is empty", function () {
    const data = { foreignIndicia: [] };
    const result = mapRequest.mapForeignIndiciaList(data);
    expect(result).to.have.property("IsForeignIndiciaList", false);
  });
  
  it("should map foreign indicia with different actions", function () {
    const data = {
      foreignIndicia: [
        { action: "DELETE", foreignTaxCountry: "CA", sourceObjectRef: [{ objectRef: [{ refKeyUser: "UserA" }] }] },
        { action: "UPDATE", foreignTaxCountry: "US" }
      ]
    };
    const result = mapRequest.mapForeignIndiciaList(data);
    
    expect(result.IsForeignIndiciaList).to.be.true;
    expect(result.foreignIndiciaData.AmendForeignIndicia[0].Action).to.equal("DELETE");
  });
});
