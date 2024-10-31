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
