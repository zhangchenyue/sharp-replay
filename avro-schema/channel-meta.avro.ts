export const CHANNEL_META: any = {
  type: 'record',
  name: 'ChannelMetadata',
  namespace: 'Energistics.Protocol.ChannelStreaming',
  fields: [
    {
      name: 'channels',
      type: {
        type: 'array',
        items: {
          type: 'record',
          name: 'ChannelMetadataRecord',
          namespace: 'Energistics.Datatypes.ChannelData',
          fields: [
            { name: 'channelUri', type: 'string' },
            { name: 'channelId', type: 'long' },
            {
              name: 'indexes',
              type: {
                type: 'array',
                items: {
                  type: 'record',
                  name: 'IndexMetadataRecord',
                  namespace: 'Energistics.Datatypes.ChannelData',
                  fields: [
                    {
                      name: 'indexType',
                      type: {
                        type: 'enum',
                        name: 'ChannelIndexTypes',
                        namespace: 'Energistics.Datatypes.ChannelData',
                        symbols: ['Time', 'Depth', 'ElapsedTime'],
                        fullName: 'Energistics.Datatypes.ChannelData.ChannelIndexTypes',
                        depends: []
                      }
                    },
                    { name: 'uom', type: 'string' },
                    { name: 'datum', type: ['null', 'string'] },
                    {
                      name: 'direction',
                      type: {
                        type: 'enum',
                        name: 'IndexDirections',
                        namespace: 'Energistics.Datatypes.ChannelData',
                        symbols: ['Increasing', 'Decreasing'],
                        fullName: 'Energistics.Datatypes.ChannelData.IndexDirections',
                        depends: []
                      }
                    },
                    { name: 'mnemonic', type: ['null', 'string'] },
                    { name: 'description', type: ['null', 'string'] },
                    { name: 'uri', type: ['null', 'string'] },
                    {
                      name: 'customData',
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
                                    { name: 'offset', type: 'float' }
                                  ],
                                  fullName: 'Energistics.Datatypes.DateTime',
                                  depends: []
                                },
                                {
                                  type: 'record',
                                  name: 'ArrayOfDouble',
                                  namespace: 'Energistics.Datatypes',
                                  fields: [{ name: 'values', type: { type: 'array', items: 'double' } }],
                                  fullName: 'Energistics.Datatypes.ArrayOfDouble',
                                  depends: []
                                },
                                'boolean'
                              ]
                            }
                          ],
                          fullName: 'Energistics.Datatypes.DataValue',
                          depends: ['Energistics.Datatypes.DateTime', 'Energistics.Datatypes.ArrayOfDouble']
                        }
                      }
                    }
                  ],
                  fullName: 'Energistics.Datatypes.ChannelData.IndexMetadataRecord',
                  depends: [
                    'Energistics.Datatypes.ChannelData.ChannelIndexTypes',
                    'Energistics.Datatypes.ChannelData.IndexDirections',
                    'Energistics.Datatypes.DataValue'
                  ]
                }
              }
            },
            { name: 'mnemonic', type: 'string' },
            { name: 'dataType', type: 'string' },
            { name: 'uom', type: 'string' },
            {
              name: 'startIndex',
              type: [
                'null',
                {
                  type: 'record',
                  name: 'IndexValue',
                  namespace: 'Energistics.Datatypes.ChannelData',
                  fields: [{ name: 'item', type: ['Energistics.Datatypes.DateTime', 'double', 'long'] }],
                  fullName: 'Energistics.Datatypes.ChannelData.IndexValue',
                  depends: ['Energistics.Datatypes.DateTime']
                }
              ]
            },
            { name: 'endIndex', type: ['null', 'IndexValue'] },
            { name: 'description', type: 'string' },
            {
              name: 'status',
              type: {
                type: 'enum',
                name: 'ChannelStatuses',
                namespace: 'Energistics.Datatypes.ChannelData',
                symbols: ['Active', 'Inactive', 'Closed'],
                fullName: 'Energistics.Datatypes.ChannelData.ChannelStatuses',
                depends: []
              }
            },
            {
              name: 'objectMetadata',
              type: [
                'null',
                {
                  type: 'record',
                  name: 'Resource',
                  namespace: 'Energistics.Datatypes.Object',
                  fields: [
                    { name: 'uri', type: 'string' },
                    { name: 'contentType', type: 'string' },
                    { name: 'name', type: 'string' },
                    { name: 'channelSubscribable', type: 'boolean' },
                    { name: 'customData', type: { type: 'map', values: 'string' } },
                    { name: 'resourceType', type: 'string' },
                    { name: 'hasChildren', type: 'int' },
                    { name: 'uuid', type: ['null', 'string'] },
                    { name: 'lastChanged', type: 'Energistics.Datatypes.DateTime' },
                    { name: 'objectNotifiable', type: 'boolean' }
                  ],
                  fullName: 'Energistics.Datatypes.Object.Resource',
                  depends: ['Energistics.Datatypes.DateTime']
                }
              ]
            },
            { name: 'source', type: 'string' },
            { name: 'measureClass', type: 'string' }
          ],
          fullName: 'Energistics.Datatypes.ChannelData.ChannelMetadataRecord',
          depends: [
            'Energistics.Datatypes.ChannelData.IndexMetadataRecord',
            'Energistics.Datatypes.ChannelData.IndexValue',
            'Energistics.Datatypes.ChannelData.IndexValue',
            'Energistics.Datatypes.ChannelData.ChannelStatuses',
            'Energistics.Datatypes.Object.Resource'
          ]
        }
      }
    }
  ],
  messageType: '2',
  // protocol: '1',
  senderRole: 'producer',
  protocolRoles: 'producer,consumer',
  fullName: 'Energistics.Protocol.ChannelStreaming.ChannelMetadata',
  depends: ['Energistics.Datatypes.ChannelData.ChannelMetadataRecord']
};
