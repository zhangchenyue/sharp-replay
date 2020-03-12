export const PRISM_MSG_HEADER: any = {
  type: 'record',
  name: 'PrismHeader',
  namespace: 'Slb.Prism.Shared.Library.Protocol.V3',
  fields: [
    {
      name: 'version',
      type: {
        type: 'record',
        name: 'Version',
        namespace: 'Slb.Prism.Shared.Library.Protocol',
        fields: [
          {
            name: 'major',
            doc: 'Major version needs to be incremented when incompatible schema changes are made.',
            type: 'int'
          },
          {
            name: 'minor',
            doc: 'Minor version needs to be incremented when backward compatible schema enhancement are made.',
            type: 'int'
          },
          {
            name: 'revision',
            doc: 'Not use. Always set to 0 at this stage.',
            type: 'int'
          },
          {
            name: 'patch',
            doc: 'Patch version needs to be incremented when backwards-compatible bug fixes, typo...',
            type: 'int'
          }
        ],
        stability: 'frozen'
      }
    },
    {
      name: 'messageId',
      doc: '[Mandatory] Unique identifier of the message.',
      type: {
        type: 'fixed',
        name: 'MessageId',
        namespace: 'Slb.Prism.Shared.Library.Protocol',
        size: 16,
        stability: 'stable',
        reference: 'https://issues.apache.org/jira/browse/AVRO-1962'
      }
    },
    {
      name: 'sessionId',
      doc: '[Mandatory] The open ETP session under which all messages (specified as ETP or not) are transported.',
      type: {
        type: 'fixed',
        name: 'SessionId',
        namespace: 'Slb.Prism.Shared.Library.Protocol',
        size: 16,
        stability: 'stable',
        reference: 'https://issues.apache.org/jira/browse/AVRO-1962'
      }
    },
    {
      name: 'containerId',
      doc: '[Mandatory] Identifier of the container which the transported data belongs to.',
      type: 'string'
    },
    {
      name: 'source',
      doc: '[Mandatory] Name of the system producer of teh message.',
      type: 'string'
    },
    {
      name: 'contentType',
      doc: '[Mandatory] Follows RFC1341 describing the content of the message.',
      type: 'string'
    }
  ],
  fullName: 'Slb.Prism.Shared.Library.Protocol.V3.PrismHeader'
};
