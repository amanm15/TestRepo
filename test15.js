const chaiAsPromised = require("chai-as-promised");
const chai = require("chai");
chai.use(chaiAsPromised);
const proxyquire = require("proxyquire");
const sinon = require("sinon");
const { expect } = require("chai");
const { getInvolvedParty } = require("../service/subService/getInvolvedParty/index");
const mockmappedResponse = require("./mocks/mockmappedResponse.json");

let infoV2Stub = sinon.stub();
let sendRequestStub = sinon.stub();
let getInvolvedParty_OCIFtoCGStub = sinon.stub();

describe('Testing index.js', function () {
  let index;

  before(function () {
    index = proxyquire('../service/subService/getInvolvedParty/index.js', {
      "@bmo-util/framework": {
        infoV2: infoV2Stub,
        debugV2: sinon.stub(),
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

    const response = await getInvolvedParty({}, payload);
    
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

  it("should call sendRequest and return mapped response", async function () {
    const args = {
      sm: {}, // Mocking the sm property
      host: "mockedHost",
      authenticationResources: {
        fetchParamterFromCache: sinon.stub().resolves('mockedHost')
      }
    };
    const payload = { requestForeignTaxEntity: true };
    
    const mockResponse = { statusCode: 200, body: '<xml></xml>' };
    sendRequestStub.resolves(mockResponse);
    getInvolvedParty_OCIFtoCGStub.resolves(mockmappedResponse);

    const response = await getInvolvedParty(args, payload);

    expect(sendRequestStub.calledOnce).to.be.true;
    expect(getInvolvedParty_OCIFtoCGStub.calledOnce).to.be.true;
    expect(response).to.deep.equal(mockmappedResponse);
    expect(infoV2Stub.calledWith("GetInvolvedParty OCIF XML Response", mockResponse.statusCode)).to.be.true;
  });

  it("should log an error and throw if sendRequest fails", async function () {
    const args = {
      sm: {}, // Mocking the sm property
      host: "mockedHost"
    };
    const payload = { requestForeignTaxEntity: true };

    sendRequestStub.rejects(new Error("Send request error"));

    await expect(getInvolvedParty(args, payload)).to.be.rejectedWith("Send request error");
  });

  it("should log an error and throw if getInvolvedParty_OCIFtoCG fails", async function () {
    const args = {
      sm: {}, // Mocking the sm property
      host: "mockedHost"
    };
    const payload = { requestForeignTaxEntity: true };

    const mockResponse = { statusCode: 200, body: '<xml></xml>' };
    sendRequestStub.resolves(mockResponse);
    getInvolvedParty_OCIFtoCGStub.rejects(new Error("Mapping error"));

    await expect(getInvolvedParty(args, payload)).to.be.rejectedWith("Mapping error");
  });
});
