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

  it("should skip array elements when template array contains undefined elements", function () {
    const template = { "ns:Items": [undefined] };
    const payload = { Items: [{ Name: "Item1" }] };

    const result = mapRequest._injectNamespace(template, payload);

    expect(result).to.deep.equal({});
  });

  it("should handle cases where nested objects are missing in payload", function () {
    const template = { "ns:Parent": { "ns:Child": { "ns:Grandchild": {} } } };
    const payload = { Parent: { Child: {} } }; // Missing Grandchild key in payload

    const result = mapRequest._injectNamespace(template, payload);

    expect(result).to.deep.equal({
      "ns:Parent": { "ns:Child": {} }, // Grandchild is not added as it’s not in payload
    });
  });

  it("should handle undefined array elements in template and ignore them", function () {
    const template = { "ns:Items": [{ "ns:Item": undefined }] };
    const payload = { Items: [{ Name: "Item1" }] };

    const result = mapRequest._injectNamespace(template, payload);

    expect(result).to.deep.equal({});
  });

  it("should return an empty object when template has undefined values", function () {
    const template = { "ns:UndefinedKey": undefined };
    const payload = { UndefinedKey: "SomeValue" };

    const result = mapRequest._injectNamespace(template, payload);

    expect(result).to.deep.equal({});
  });
});
