export const ETP_MSG_HEADER: any = {
  type: 'record',
  namespace: 'Energistics.Datatypes',
  name: 'MessageHeader',
  fields: [
    {
      name: 'protocol',
      type: 'int'
    },
    {
      name: 'messageType',
      type: 'int'
    },
    {
      name: 'correlationId',
      type: 'long'
    },
    {
      name: 'messageId',
      type: 'long'
    },
    {
      name: 'messageFlags',
      type: 'int'
    }
  ],
  fullName: 'Energistics.Datatypes.MessageHeader'
};
