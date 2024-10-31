const { expect } = require('chai');
const mapRequest = require('../path/to/mapRequest'); // Adjust the path as needed

describe("_injectNamespace", function () {
  it("should handle array values in the payload", function () {
    const template = { "ns:Items": [{ "ns:Item": { "ns:Name": {} } }] };
    const payload = { Items: [{ Name: "Item1" }] };

    const result = mapRequest._injectNamespace(template, payload);

    expect(result).to.deep.equal({
      "ns:Items": [{ "ns:Item": { "ns:Name": "Item1" } }],
    });
  });

  it("should handle nested object values in the payload", function () {
    const template = { "ns:Parent": { "ns:Child": { "ns:Grandchild": {} } } };
    const payload = { Parent: { Child: { Grandchild: "Value" } } };

    const result = mapRequest._injectNamespace(template, payload);

    expect(result).to.deep.equal({
      "ns:Parent": { "ns:Child": { "ns:Grandchild": "Value" } },
    });
  });

  it("should handle plain values in the payload", function () {
    const template = { "ns:Simple": {} };
    const payload = { Simple: "JustAValue" };

    const result = mapRequest._injectNamespace(template, payload);

    expect(result).to.deep.equal({
      "ns:Simple": "JustAValue",
    });
  });

  it("should skip keys not present in the payload", function () {
    const template = { "ns:UnusedKey": {}, "ns:UsedKey": {} };
    const payload = { UsedKey: "Value" };

    const result = mapRequest._injectNamespace(template, payload);

    expect(result).to.deep.equal({
      "ns:UsedKey": "Value",
    });
  });

  it("should handle empty template and payload objects", function () {
    const template = {};
    const payload = {};

    const result = mapRequest._injectNamespace(template, payload);

    expect(result).to.deep.equal({});
  });

  it("should return an empty object for undefined inputs", function () {
    const result = mapRequest._injectNamespace(undefined, undefined);
    expect(result).to.deep.equal({});
  });

  it("should return an empty object for null inputs", function () {
    const result = mapRequest._injectNamespace(null, null);
    expect(result).to.deep.equal({});
  });
});
