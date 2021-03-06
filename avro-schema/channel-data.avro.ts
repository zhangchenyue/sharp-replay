export const CHANNEL_DATA: any = {
  type: 'record',
  name: 'ChannelData',
  namespace: 'Energistics.Protocol.ChannelStreaming',
  fields: [
    {
      name: 'data',
      type: {
        type: 'array',
        items: {
          type: 'record',
          name: 'DataItem',
          namespace: 'Energistics.Datatypes.ChannelData',
          fields: [
            {
              name: 'indexes',
              type: {
                type: 'array',
                items: {
                  type: 'record',
                  name: 'IndexValue',
                  namespace: 'Energistics.Datatypes.ChannelData',
                  fields: [
                    {
                      name: 'item',
                      type: [
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
                        'double',
                        'long',
                      ],
                    },
                  ],
                  fullName: 'Energistics.Datatypes.ChannelData.IndexValue',
                  depends: ['Energistics.Datatypes.DateTime'],
                },
              },
            },
            { name: 'channelId', type: 'long' },
            {
              name: 'value',
              type: {
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
                      'DateTime',
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
            {
              name: 'valueAttributes',
              type: {
                type: 'array',
                items: {
                  type: 'record',
                  name: 'DataAttribute',
                  namespace: 'Energistics.Datatypes',
                  fields: [
                    { name: 'attributeId', type: 'int' },
                    { name: 'attributeValue', type: 'DataValue' },
                  ],
                  fullName: 'Energistics.Datatypes.DataAttribute',
                  depends: ['Energistics.Datatypes.DataValue'],
                },
              },
            },
          ],
          fullName: 'Energistics.Datatypes.ChannelData.DataItem',
          depends: [
            'Energistics.Datatypes.ChannelData.IndexValue',
            'Energistics.Datatypes.DataValue',
            'Energistics.Datatypes.DataAttribute',
          ],
        },
      },
    },
  ],
  messageType: '3',
  senderRole: 'producer',
  protocolRoles: 'producer,consumer',
  fullName: 'Energistics.Protocol.ChannelStreaming.ChannelData',
  depends: ['Energistics.Datatypes.ChannelData.DataItem'],
};
