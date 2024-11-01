const _injectNamespace = (template, payload) => {
  let result = {};

  for (let [key, value] of Object.entries(template)) {
    // stripped (without ns) key, should correspond to the payload property
    let curKey = key.split(":")[1];

    // if payload contains the specific key, reconstruct its value with proper ns
    if (Object.keys(payload).includes(curKey)) {
      // handle array values in the payload
      if (Array.isArray(payload[curKey])) {
        result[key] = [];

        // for each array element, recursively apply _injectNamespace
        payload[curKey].forEach(elem => {
          result[key].push(_injectNamespace(value[0], elem));
        });
      }
      // handle nested object values in the payload
      else if (typeof payload[curKey] === "object") {
        result[key] = _injectNamespace(value[0], payload[curKey]);
      }
      // handle plain values
      else {
        result[key] = payload[curKey];
      }
    }
  }
  
  return result;
};

// Unit tests for `_injectNamespace`
describe("_injectNamespace (local test implementation)", function () {
  it("should handle array values in the payload", function () {
    const template = { "ns:Items": [{ "ns:Item": { "ns:Name": {} } }] };
    const payload = { Items: [{ Name: "Item1" }] };

    const result = _injectNamespace(template, payload);

    expect(result).to.deep.equal({
      "ns:Items": [{ "ns:Item": { "ns:Name": "Item1" } }],
    });
  });

  it("should handle nested object values in the payload", function () {
    const template = { "ns:Parent": { "ns:Child": { "ns:Grandchild": {} } } };
    const payload = { Parent: { Child: { Grandchild: "Value" } } };

    const result = _injectNamespace(template, payload);

    expect(result).to.deep.equal({
      "ns:Parent": { "ns:Child": { "ns:Grandchild": "Value" } },
    });
  });

  it("should handle plain values in the payload", function () {
    const template = { "ns:Simple": {} };
    const payload = { Simple: "JustAValue" };

    const result = _injectNamespace(template, payload);

    expect(result).to.deep.equal({
      "ns:Simple": "JustAValue",
    });
  });

  it("should skip keys not present in the payload", function () {
    const template = { "ns:UnusedKey": {}, "ns:UsedKey": {} };
    const payload = { UsedKey: "Value" };

    const result = _injectNamespace(template, payload);

    expect(result).to.deep.equal({
      "ns:UsedKey": "Value",
    });
  });

  it("should handle empty template and payload objects", function () {
    const template = {};
    const payload = {};

    const result = _injectNamespace(template, payload);

    expect(result).to.deep.equal({});
  });

  it("should skip array elements when template array contains undefined elements", function () {
    const template = { "ns:Items": [undefined] };
    const payload = { Items: [{ Name: "Item1" }] };

    const result = _injectNamespace(template, payload);

    expect(result).to.deep.equal({});
  });

  it("should handle cases where nested objects are missing in payload", function () {
    const template = { "ns:Parent": { "ns:Child": { "ns:Grandchild": {} } } };
    const payload = { Parent: { Child: {} } }; // Missing Grandchild key in payload

    const result = _injectNamespace(template, payload);

    expect(result).to.deep.equal({
      "ns:Parent": { "ns:Child": {} }, // Grandchild is not added as it’s not in payload
    });
  });

  it("should handle undefined array elements in template and ignore them", function () {
    const template = { "ns:Items": [{ "ns:Item": undefined }] };
    const payload = { Items: [{ Name: "Item1" }] };

    const result = _injectNamespace(template, payload);

    expect(result).to.deep.equal({});
  });

  it("should return an empty object when template has undefined values", function () {
    const template = { "ns:UndefinedKey": undefined };
    const payload = { UndefinedKey: "SomeValue" };

    const result = _injectNamespace(template, payload);

    expect(result).to.deep.equal({});
  });
});
