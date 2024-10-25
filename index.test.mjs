const { expect } = require("chai");
const sinon = require("sinon");
let debugV2 = require("path/to/debugV2"); // Adjust the path to debugV2
let fetchInitialPromises = require("path/to/fetchInitialPromises"); // Adjust the path

describe("fetchInitialPromises", () => {
    let initialPromises;
    let corrid = "12345";
    let errorLogs = [];

    beforeEach(() => {
        sinon.restore(); // Reset all stubs/spies before each test
        errorLogs = [];  // Reset errorLogs before each test
    });

    it("should not log errors when promises resolve successfully", async () => {
        initialPromises = [Promise.resolve("value1"), Promise.resolve("value2")];

        const debugSpy = sinon.spy(debugV2);

        await fetchInitialPromises(initialPromises, corrid);

        expect(errorLogs).to.be.empty;
        expect(debugSpy.called).to.be.false;
    });

    it("should log errors and call debugV2 when promises are rejected", async () => {
        const mockError = new Error("Test error");
        initialPromises = [Promise.reject(mockError)];

        const debugStub = sinon.stub(debugV2);

        await fetchInitialPromises(initialPromises, corrid);

        // Check errorLogs content
        expect(errorLogs).to.deep.equal([
            ["initial Promises Error", JSON.stringify(mockError), corrid],
            {
                status: "500",
                title: "Error in getting the values from initial promises",
                msg: "Initial.Promises.Error",
                err: mockError
            }
        ]);

        // Check that debugV2 was called with the correct arguments
        expect(debugStub.calledOnceWith("Error in getting cache value promises", mockError, corrid)).to.be.true;
    });
});
