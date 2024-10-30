const { expect } = require('chai');
const sinon = require('sinon');
const js2xmlparser = require('js2xmlparser');
const {
  amendInvolvedParty_OCIFtoCG,
  mapEnvelope,
  mapSoapHeader,
  mapSoapBody,
  mapAmendInvolvedPartyInputHeader,
  mapInvolvedPartyIdentifier,
  mapAmendInvolvedPartyInputBody,
  mapAmendIdentification,
  mapForeignIndiciaList,
  mapForeignSupportDocumentList,
  mapForeignTaxEntityObj,
  mapForeignTaxIndividualObj,
  mapForeignTaxCountryList,
  mapForeignTaxRoleList,
  mapForeignTaxTrustList,
} = require('../updateEtchDatamapRequest'); // Adjust path as necessary

describe('mapRequest.js Functions', function () {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('amendInvolvedParty_OCIFtoCG', function () {
    it('should return a properly formatted XML request', async function () {
      const payload = { sample: 'data' };
      const mockXmlOutput = '<xml>mock</xml>';
      const parseStub = sandbox.stub(js2xmlparser, 'parse').returns(mockXmlOutput);

      const result = await amendInvolvedParty_OCIFtoCG(payload);

      expect(result).to.equal(mockXmlOutput);
      expect(parseStub.calledOnce).to.be.true;
    });

    it('should log and throw an error if mapping fails', async function () {
      const payload = { sample: 'data' };
      const error = new Error('Parsing error');
      const logError = sandbox.stub(console, 'error');
      sandbox.stub(js2xmlparser, 'parse').throws(error);

      await expect(amendInvolvedParty_OCIFtoCG(payload)).to.be.rejectedWith(error);
      expect(logError.calledOnce).to.be.true;
    });
  });

  describe('mapEnvelope', function () {
    it('should map payload correctly and return an envelope structure', function () {
      const payload = { originatorData: { channel: 'WEB', appCatId: 'app123' } };
      const result = mapEnvelope(payload);

      expect(result).to.be.an('object');
      expect(result.envelope).to.have.property('Header');
      expect(result.envelope.Header.bmoHdrRq).to.include({
        version: '1.0',
        chInst: 'OnLine',
      });
    });
  });

  describe('mapSoapHeader', function () {
    it('should map originator data to SOAP header correctly', function () {
      const originatorData = { channel: 'WEB', appCatId: 'app123' };
      const result = mapSoapHeader(originatorData);

      expect(result).to.have.property('IsHeader', true);
      expect(result.header.Header.bmoHdrRq.srcInfo.chType).to.equal('WEB');
    });
  });

  describe('mapAmendInvolvedPartyInputBody', function () {
    it('should return formatted InputBody with all mapped objects', function () {
      const payload = { identifier: { id: '12345' }, originatorData: { country: 'CA' } };
      const result = mapAmendInvolvedPartyInputBody(payload);

      expect(result).to.be.an('object');
      expect(result.inputBody.AmendInvolvedPartyInputBody).to.include.keys(
        'AmendForeignIndicia',
        'AmendForeignSupportDocuments',
        'AmendForeignTaxEntity',
        'AmendForeignTaxIndividual'
      );
    });
  });

  describe('Foreign and Tax Mapping Helpers', function () {
    const payload = {
      foreignIndicia: [{ action: 'ADD', lastMaintainedDate: '2024-10-30' }],
      foreignTaxRole: [{ action: 'ADD', lastMaintainedDate: '2024-10-30' }],
    };

    it('should map foreign indicia correctly', function () {
      const result = mapForeignIndiciaList(payload);

      expect(result.IsForeignIndiciaList).to.be.true;
      expect(result.foreignIndiciaData.AmendForeignIndicia[0]).to.have.property('Action', 'ADD');
    });

    it('should map foreign tax role correctly', function () {
      const result = mapForeignTaxRoleList(payload);

      expect(result.IsForeignTaxRole).to.be.true;
      expect(result.foreignTaxRoleData.AmendForeignTaxRole[0]).to.have.property('Action', 'ADD');
    });
  });

  describe('Helper Functions', function () {
    it('should format foreign tax entity data correctly', function () {
      const data = { foreignTaxEntity: { action: 'ADD', canadianTaxResident: true } };
      const result = mapForeignTaxEntityObj(data);

      expect(result.IsForeignTaxEntityObj).to.be.true;
      expect(result.foreignTaxEntityData.AmendForeignTaxEntity.Action).to.equal('ADD');
    });

    it('should handle missing fields in mapForeignTaxCountryList gracefully', function () {
      const data = {};
      const result = mapForeignTaxCountryList(data);

      expect(result.IsForeignTaxCountry).to.be.false;
      expect(result.foreignTaxCountryData).to.deep.equal({});
    });
  });

  describe('Additional Tests for Full Coverage', function () {
    it('should handle mapperHelper function for foreign indicia records', function () {
      const data = {
        foreignIndicia: [
          {
            action: 'UPDATE',
            lastMaintainedDate: '2024-10-30T12:34:56Z',
            sourceObjectRef: [{ objectRef: [{ refKeyUser: 'user1', refKeyValue: '123' }] }],
            transitNumber: '001',
          },
        ],
      };

      const result = mapForeignIndiciaList(data);
      expect(result.foreignIndiciaData.AmendForeignIndicia[0]).to.have.property('Action', 'UPDATE');
      expect(result.foreignIndiciaData.AmendForeignIndicia[0].ForeignIndicia).to.have.property('TransitNumber', '001');
    });
  });
});
