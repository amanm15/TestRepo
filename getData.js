const { expect } = require("chai");
const sinon = require("sinon");

// Import the getData function
const getData = require("../path/to/your/file").getData;

describe("getData", () => {
  let readFileStub;

  beforeEach(() => {
    // Stub fs.promises.readFile
    readFileStub = sinon.stub(require("fs").promises, "readFile");
  });

  afterEach(() => {
    // Restore the original method
    sinon.restore();
  });

  it("should return file content when readFile succeeds", async () => {
    const mockContent = "File content here";
    const fileName = "test.txt";

    // Arrange: Stub readFile to resolve with mockContent
    readFileStub.resolves(mockContent);

    // Act: Call getData and check the result
    const result = await getData(fileName);

    // Assert: Check that getData returned the content
    expect(result).to.equal(mockContent);
    expect(readFileStub.calledOnceWith(fileName, { encoding: "utf8" })).to.be.true;
  });

  it("should throw an error when readFile fails", async () => {
    const fileName = "test.txt";
    const error = new Error("File not found");

    // Arrange: Stub readFile to reject with an error
    readFileStub.rejects(error);

    // Act & Assert: Expect getData to throw the error
    await expect(getData(fileName)).to.be.rejectedWith("File not found");
    expect(readFileStub.calledOnceWith(fileName, { encoding: "utf8" })).to.be.true;
  });

  it("should use default encoding 'utf8' if no type is specified", async () => {
    const mockContent = "Default encoding content";
    const fileName = "test.txt";

    // Arrange: Stub readFile to resolve with mockContent
    readFileStub.resolves(mockContent);

    // Act: Call getData without specifying an encoding type
    const result = await getData(fileName);

    // Assert: Check that the default encoding was used
    expect(result).to.equal(mockContent);
    expect(readFileStub.calledOnceWith(fileName, { encoding: "utf8" })).to.be.true;
  });

  it("should use specified encoding type if provided", async () => {
    const mockContent = "Different encoding content";
    const fileName = "test.txt";
    const encodingType = "base64";

    // Arrange: Stub readFile to resolve with mockContent
    readFileStub.resolves(mockContent);

    // Act: Call getData with specified encoding
    const result = await getData(fileName, encodingType);

    // Assert: Check that the specified encoding was used
    expect(result).to.equal(mockContent);
    expect(readFileStub.calledOnceWith(fileName, { encoding: encodingType })).to.be.true;
  });
});