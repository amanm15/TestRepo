const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const proxyquire = require("proxyquire");
const sinon = require("sinon");

chai.use(chaiAsPromised);
const { expect } = chai;

const args = require("/mockData/mocks");
const getInvolvedParty = require("../service/subService/getInvolvedParty/index");
const requestControlObj = require("/mockData/requestControlobj.json");
const emptyRequestControl = require("/mockData/emptyRequestControl.json");
const response629 = require("/mocks/response629.json");
const payload = require("/mocks/payload.json");
const payloadFalseRequestControl = require("/mocks/payloadwithfalserequestcontrol.json");
const mockMappedResponse = require("./mocks/mockmappedResponse.json");

let infoV2Stub;
let sendRequestStub;
let getInvolvedParty_OCIFtoCGStub;

const mockResponse = { statusCode: 200, body: '<xml></xml>' };

describe('Testing index.js', function () {
  beforeEach(function () {
infoV2Stub = sinon.stub();
sendRequestStub = sinon.stub();
getInvolvedParty_OCIFtoCGStub = sinon.stub();
  });

  const getInvolvedParty = proxyquire('../service/subService/getInvolvedParty/index', {
    '@bmo-util/framework': {
      infoV2: infoV2Stub
    },
    './sendRequest': {
      sendRequest: sendRequestStub
    },
    './mapResponse': {
      getInvolvedParty_OCIFtoCG: getInvolvedParty_OCIFtoCGStub
    }
  }).getInvolvedParty;

  it("should return 400 when no valid request control flags are set", async function () {
    const response = await getInvolvedParty(args, payloadFalseRequestControl);

    expect(response.statusCode).to.equal(400);
    expect(response.body).to.deep.equal({
      type: "Failure",
      title: "Invalid Data Error",
      status: 400,
      detail: "no data was requested, atleast one must be true"
    });
  });

  it("should call sendRequest and getInvolvedParty_OCIFtoCG with correct parameters on success", async function () {
    sendRequestStub.resolves(mockResponse);
    getInvolvedParty_OCIFtoCGStub.resolves(mockMappedResponse);

    const response = await getInvolvedParty(args, payload);

    expect(sendRequestStub.calledOnceWithExactly(args, payload)).to.be.true;
    expect(infoV2Stub.calledOnceWithExactly("GetInvolvedParty OCIF XML Response", mockResponse)).to.be.true;
    expect(getInvolvedParty_OCIFtoCGStub.calledOnceWithExactly(args, mockResponse.body, mockResponse.statusCode, sinon.match.object)).to.be.true;
    expect(response).to.deep.equal(mockMappedResponse);
  });

  it("should log error and throw when sendRequest fails", async function () {
    const error = new Error('sendRequest failed');
    sendRequestStub.rejects(error);

    await expect(getInvolvedParty(args, payload)).to.be.rejectedWith(error);
    expect(infoV2Stub.notCalled).to.be.true;
  });

  it("should log error and throw when getInvolvedParty_OCIFtoCG fails", async function () {
    sendRequestStub.resolves(mockResponse);
    const error = new Error('getInvolvedParty_OCIFtoCG failed');
    getInvolvedParty_OCIFtoCGStub.rejects(error);

    await expect(getInvolvedParty(args, payload)).to.be.rejectedWith(error);
    expect(infoV2Stub.calledOnceWithExactly("GetInvolvedParty OCIF XML Response", mockResponse)).to.be.true;
  });

  it("should handle an empty payload correctly", async function () {
    const response = await getInvolvedParty(args, {});

    expect(response.statusCode).to.equal(400);
    expect(response.body).to.deep.equal({
      type: "Failure",
      title: "Invalid Data Error",
      status: 400,
      detail: "no data was requested, atleast one must be true"
    });
  });

  it("should handle a payload with partial data correctly", async function () {
    const partialPayload = {
      requestForeignTaxEntity: true,
      requestForeignTaxTrust: false,
      requestForeignIndicia: false,
    };

    sendRequestStub.resolves(mockResponse);
    getInvolvedParty_OCIFtoCGStub.resolves(mockMappedResponse);

    const response = await getInvolvedParty(args, partialPayload);

    expect(sendRequestStub.calledOnceWithExactly(args, partialPayload)).to.be.true;
    expect(response).to.deep.equal(mockMappedResponse);
  });
});
