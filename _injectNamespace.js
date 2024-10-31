const { expect } = require("chai");
const mapRequest = require("../path/to/mapRequest.js"); // Adjust path as needed

describe("_injectNamespace", function () {
  it("should return an empty result for empty template and payload", function () {
    const template = {};
    const payload = {};
    const result = mapRequest._injectNamespace(template, payload);
    expect(result).to.deep.equal({});
  });

  it("should handle a payload with array values", function () {
    const template = {
      "ns:Items": [{
        "ns:Item": { "ns:Name": {} }
      }]
    };
    const payload = {
      Items: [
        { Name: "Item1" },
        { Name: "Item2" }
      ]
    };
    const result = mapRequest._injectNamespace(template, payload);

    expect(result).to.deep.equal({
      "ns:Items": [
        { "ns:Item": { "ns:Name": "Item1" } },
        { "ns:Item": { "ns:Name": "Item2" } }
      ]
    });
  });

  it("should handle a payload with object values", function () {
    const template = {
      "ns:Customer": {
        "ns:Name": {},
        "ns:Address": { "ns:City": {}, "ns:Country": {} }
      }
    };
    const payload = {
      Customer: {
        Name: "Alice",
        Address: { City: "Toronto", Country: "Canada" }
      }
    };
    const result = mapRequest._injectNamespace(template, payload);

    expect(result).to.deep.equal({
      "ns:Customer": {
        "ns:Name": "Alice",
        "ns:Address": {
          "ns:City": "Toronto",
          "ns:Country": "Canada"
        }
      }
    });
  });

  it("should handle payload with simple (non-object, non-array) values", function () {
    const template = { "ns:Value": {} };
    const payload = { Value: "SimpleValue" };
    const result = mapRequest._injectNamespace(template, payload);
    expect(result).to.deep.equal({ "ns:Value": "SimpleValue" });
  });

  it("should recursively inject namespaces for nested templates and payloads", function () {
    const template = {
      "ns:Order": {
        "ns:OrderId": {},
        "ns:Items": [{
          "ns:Item": { "ns:Name": {}, "ns:Quantity": {} }
        }]
      }
    };
    const payload = {
      Order: {
        OrderId: "123",
        Items: [
          { Name: "Item1", Quantity: 1 },
          { Name: "Item2", Quantity: 2 }
        ]
      }
    };
    const result = mapRequest._injectNamespace(template, payload);

    expect(result).to.deep.equal({
      "ns:Order": {
        "ns:OrderId": "123",
        "ns:Items": [
          { "ns:Item": { "ns:Name": "Item1", "ns:Quantity": 1 } },
          { "ns:Item": { "ns:Name": "Item2", "ns:Quantity": 2 } }
        ]
      }
    });
  });
});
