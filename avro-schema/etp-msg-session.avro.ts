export const ETP_MSG_SESSION: any = {
  type: 'record',
  name: 'RequestSession',
  namespace: 'Energistics.Protocol.Core',
  fields: [
    { name: 'applicationName', type: 'string' },
    {
      name: 'requestedProtocols',
      type: {
        type: 'array',
        items: {
          type: 'record',
          name: 'SupportedProtocol',
          namespace: 'Energistics.Datatypes',
          fields: [
            { name: 'protocol', type: 'int' },
            {
              name: 'protocolVersion',
              type: {
                type: 'record',
                name: 'Version',
                namespace: 'Energistics.Datatypes',
                fields: [
                  { name: 'major', type: 'int' },
                  { name: 'minor', type: 'int' },
                  { name: 'revision', type: 'int' },
                  { name: 'patch', type: 'int' },
                ],
                fullName: 'Energistics.Datatypes.Version',
                depends: [],
              },
            },
            { name: 'role', type: 'string' },
            {
              name: 'protocolCapabilities',
              type: {
                type: 'map',
                values: {
                  type: 'record',
                  name: 'DataValue',
                  namespace: 'Energistics.Datatypes',
                  fields: [
                    {
                      name: 'item',
                      type: [
                        'null',
                        'double',
                        'float',
                        'int',
                        'long',
                        'string',
                        {
                          type: 'record',
                          name: 'DateTime',
                          namespace: 'Energistics.Datatypes',
                          aliases: ['etp.dt'],
                          fields: [
                            { name: 'time', type: 'long' },
                            { name: 'offset', type: 'float' },
                          ],
                          fullName: 'Energistics.Datatypes.DateTime',
                          depends: [],
                        },
                        {
                          type: 'record',
                          name: 'ArrayOfDouble',
                          namespace: 'Energistics.Datatypes',
                          fields: [{ name: 'values', type: { type: 'array', items: 'double' } }],
                          fullName: 'Energistics.Datatypes.ArrayOfDouble',
                          depends: [],
                        },
                        'boolean',
                      ],
                    },
                  ],
                  fullName: 'Energistics.Datatypes.DataValue',
                  depends: ['Energistics.Datatypes.DateTime', 'Energistics.Datatypes.ArrayOfDouble'],
                },
              },
            },
          ],
          fullName: 'Energistics.Datatypes.SupportedProtocol',
          depends: ['Energistics.Datatypes.Version', 'Energistics.Datatypes.DataValue'],
        },
      },
    },
  ],
  messageType: '1',
  // protocol: '0',
  senderRole: 'client',
  protocolRoles: 'client,server',
  fullName: 'Energistics.Protocol.Core.RequestSession',
  depends: ['Energistics.Datatypes.SupportedProtocol'],
};

export const ETP_MSG_CLOSE_SESSION: any = {
  type: 'record',
  name: 'CloseSession',
  namespace: 'Energistics.Protocol.Core',
  fields: [{ name: 'reason', type: ['null', 'string'] }],
  messageType: '5',
  senderRole: 'client,server',
  protocolRoles: 'client,server',
  fullName: 'Energistics.Protocol.Core.CloseSession',
  depends: [],
};
