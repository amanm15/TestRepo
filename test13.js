const chaiAsPromised = require("chai-as-promised");
const chai = require("chai");
chai.use(chaiAsPromised);
const proxyquire = require("proxyquire");
const sinon = require("sinon");
const assert = require("assert");
const { args, plainRequest } = require("./mockData/mocks");
const xmlString = require("./mockData/xmlString.xml");

describe('Testing sendRequest.js', function () {
  let sendrequest;
  let mutualSSL_SMstub = sinon.stub();
  let mapper_CGToOCIFstub = sinon.stub();
  let infoV2Stub = sinon.stub();
  let getCorrelationIdstub = sinon.stub().returns(1234);
  let logErrorStub = sinon.stub();

  before(function () {
    sendrequest = proxyquire('../service/subService/getInvolvedParty/sendRequest', {
      "@bmo-util/framework": {
        infoV2: infoV2Stub,
        getCorrelationId: getCorrelationIdstub,
        logError: logErrorStub
      },
      "../../../../utilities/MutualSSLOps/operations": {
        mutualSSL_SM: mutualSSL_SMstub
      },
      "../getInvolvedParty/mapRequest.js": {
        mapper_CGToOCIF: mapper_CGToOCIFstub
      }
    });
  });

  beforeEach(() => {
    sinon.reset(); // Reset the state before each test
  });

  it("should send a request and return the response", async function () {
    // Arrange
    const expectedResponse = { data: 'mockResponse' };
    mutualSSL_SMstub.resolves(expectedResponse);
    mapper_CGToOCIFstub.returns(xmlString); // Mocking the body

    // Act
    const response = await sendrequest.sendRequest(args, plainRequest.originatorData);

    // Assert
    assert.deepEqual(response, expectedResponse);
    assert(getCorrelationIdstub.calledOnce);
  });

  it("should log error when mutualSSL_SM throws an error", async function () {
    // Arrange
    const expectedError = new Error("Test error");
    mutualSSL_SMstub.rejects(expectedError);

    // Act
    await sendrequest.sendRequest(args, plainRequest.originatorData).catch(err => {
      // Assert
      assert.equal(err, expectedError); // Ensure the correct error is thrown
      assert(logErrorStub.calledOnce); // Ensure that logError is called
      assert(logErrorStub.calledWith("error invoking OCIF GetInvolvedParty", expectedError));
    });
  });

  it("should handle missing payload identifier", async function () {
    // Arrange
    const modifiedRequest = { ...plainRequest, originatorData: { ...plainRequest.originatorData, identifier: null } };
    mapper_CGToOCIFstub.returns(xmlString);

    // Act
    const response = await sendrequest.sendRequest(args, modifiedRequest.originatorData);

    // Assert
    assert.equal(response, expectedResponse);
  });

  it("should call mapper_CGToOCIF with correct parameters", async function () {
    // Arrange
    const ocifId = "329183547430300"; // Example OCIF ID
    const channel = "BRN";
    const employeeUserId = "btucker";
    const transitNumber = "0124";
    const currTimeStamp = new Date().toISOString();
    
    mapper_CGToOCIFstub.returns(xmlString);

    // Act
    await sendrequest.sendRequest(args, plainRequest.originatorData);

    // Assert
    assert(mapper_CGToOCIFstub.calledWith(ocifId, channel, employeeUserId, transitNumber, currTimeStamp));
  });

  it("should handle production stage and mask OCIF ID", async function () {
    // Arrange
    process.env.STAGE = "prod"; // Set the environment variable to "prod"
    const ocifId = "123456789"; // Example OCIF ID
    const maskedOCIFId = "*".repeat(ocifId.length - 2) + ocifId.slice(-2);
    const expectedMaskedBody = mapper_CGToOCIF(maskedOCIFId, "BRN", "btucker", "0124", new Date().toISOString());

    mapper_CGToOCIFstub.returns(expectedMaskedBody); // Ensure the mapper returns the expected masked body

    // Mock the payload to include the identifier with the ocifId
    const modifiedPayload = {
      identifier: { id: ocifId },
      originatorData: {
        channel: "BRN",
        employeeUserId: "btucker",
        transitNumber: "0124"
      }
    };

    // Act
    await sendrequest.sendRequest(args, modifiedPayload);

    // Assert
    assert(infoV2Stub.calledWith("cg_to_GetInvolvedPartyPayload: ", expectedMaskedBody, "", true));
  });
});
