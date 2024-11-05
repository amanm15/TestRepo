const chaiAsPromised = require("chai-as-promised");
const chai = require("chai");
chai.use(chaiAsPromised);
const proxyquire = require("proxyquire");
const sinon = require("sinon");
const { expect } = require("chai");
const mockmappedResponse = require("./mocks/mockmappedResponse.json");

let infoV2Stub = sinon.stub();
let debugV2Stub = sinon.stub();
let sendRequestStub = sinon.stub();
let getInvolvedParty_OCIFtoCGStub = sinon.stub();

describe('Testing index.js', function () {
  let index;

  before(function () {
    index = proxyquire('../service/subService/getInvolvedParty/index.js', {
      "@bmo-util/framework": {
        infoV2: infoV2Stub,
        debugV2: debugV2Stub,
        logError: sinon.stub()
      },
      "./sendRequest": {
        sendRequest: sendRequestStub
      },
      "./mapResponse": {
        getInvolvedParty_OCIFtoCG: getInvolvedParty_OCIFtoCGStub
      }
    });
  });

  afterEach(() => {
    sinon.reset(); // Reset the state before each test
  });

  it("should call sendRequest, log response, and map response correctly", async function () {
    const args = {
      sm: {
        getSecretValue: () => ({
          promise: () => Promise.resolve({ SecretString: "Dummy" })
        })
      },
      host: "mockedHost"
    };

    const payload = {
      requestForeignTaxEntity: true, // This ensures the request passes validation
      originatorData: {}
    };

    // Mock the response from sendRequest
    const mockResponse = { statusCode: 200, body: '<xml></xml>' };
    sendRequestStub.resolves(mockResponse);

    // Mock the mapping function
    getInvolvedParty_OCIFtoCGStub.resolves(mockmappedResponse);

    const response = await index.getInvolvedParty(args, payload);

    // Assertions to ensure the specific lines are executed
    expect(infoV2Stub.calledOnce).to.be.true;
    expect(infoV2Stub.calledWith("GetInvolvedParty OCIF XML Response", mockResponse.statusCode)).to.be.true;

    expect(debugV2Stub.calledOnce).to.be.true;
    expect(debugV2Stub.calledWith("GetInvolvedParty OCIF XML Response", mockResponse)).to.be.true;

    // Check that the mapping function was called with the correct parameters
    expect(getInvolvedParty_OCIFtoCGStub.calledOnce).to.be.true;
    expect(getInvolvedParty_OCIFtoCGStub.calledWith(args, mockResponse.body, mockResponse.statusCode, sinon.match.any)).to.be.true;

    expect(response).to.deep.equal(mockmappedResponse);
  });

  it("should return 400 when no request control flags are true", async function () {
    const payload = {
      requestForeignTaxEntity: false,
      requestForeignTaxTrust: false,
      requestForeignIndicia: false,
      requestForeignSupportDocumentsList: false,
      requestForeignTaxCountryList: false,
      requestForeignTaxIndividual: false,
      requestForeignTaxRole: false
    };

    const response = await index.getInvolvedParty({}, payload);
    
    expect(response).to.deep.equal({
      statusCode: 400,
      body: {
        type: "Failure",
        title: "Invalid Data Error",
        status: 400,
        detail: "no data was requested, atleast one must be true"
      }
    });
  });
});
