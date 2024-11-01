describe("mapForeignIndiciaList", function () {
  it("should map foreign indicia list without checking RecordAudit", function () {
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

    // Check for IsForeignIndiciaList property to confirm the function mapped successfully
    expect(result).to.have.property("IsForeignIndiciaList", true);

    // Check for AmendForeignIndicia array structure in the result
    expect(result.foreignIndiciaData).to.have.property("AmendForeignIndicia").that.is.an("array");

    // Verify mapping results within AmendForeignIndicia, specifically the first item
    const mappedIndicia = result.foreignIndiciaData.AmendForeignIndicia[0];
    expect(mappedIndicia).to.have.property("Action", "ADD");

    // Test the properties mapped within ForeignIndicia without RecordAudit
    const foreignIndiciaDetails = mappedIndicia.ForeignIndicia;
    expect(foreignIndiciaDetails).to.have.property("TransitNumber", "1234");
    expect(foreignIndiciaDetails).to.have.property("ForeignTaxCountry", "US");
    expect(foreignIndiciaDetails).to.have.property("ForeignTaxIdentifier", "ID-123");
    expect(foreignIndiciaDetails).to.have.property("ClassificationScheme", "Scheme1");
    expect(foreignIndiciaDetails).to.have.property("OwningIPRT", "OwnIPRT");
    expect(foreignIndiciaDetails).to.have.property("InformationCollectorID", "CollectorID");
    expect(foreignIndiciaDetails).to.have.property("InformationCollectorName", "CollectorName");

    // Additional ObjectIdentifier verification
    expect(foreignIndiciaDetails).to.have.property("ObjectIdentifier", "identifierValue");
  });
});
