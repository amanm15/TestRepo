const { expect } = require("chai");
const sinon = require("sinon");
const mapRequest = require("../path/to/mapRequest");

describe("amendInvolvedParty_OCIFtoCG", function () {
  afterEach(() => {
    sinon.restore();
  });

  it("should log and throw an error if injectPayloadNamespace fails", async function () {
    const payload = { sample: "payloadData" };
    const errorMessage = new Error("Mocked error");

    // Stub injectPayloadNamespace to throw an error
    const injectPayloadNamespaceStub = sinon.stub(mapRequest, "injectPayloadNamespace").rejects(errorMessage);
    const logErrorStub = sinon.stub(mapRequest, "logError"); // Stub logError to monitor the call

    try {
      await mapRequest.amendInvolvedParty_OCIFtoCG(payload);
      throw new Error("Test should have thrown an error");
    } catch (err) {
      // Verify that the error is the same as the one we threw
      expect(err).to.equal(errorMessage);
    }

    // Verify that logError was called with the expected error message
    sinon.assert.calledWith(logErrorStub, "error mapping amendInvolvedParty Response", errorMessage);

    // Restore the stubbed functions
    injectPayloadNamespaceStub.restore();
    logErrorStub.restore();
  });
});
