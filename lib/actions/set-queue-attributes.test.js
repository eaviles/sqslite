'use strict';

const dedent = require('dedent');
const actionSetQueueAttributes = require('./set-queue-attributes');
const { setQueueAttributes } = require('../sqs');
const { ErrorWithCode } = require('../utils/errors');

jest.mock('../sqs');

const body = {
  Action: 'SetQueueAttributes',
  'Attribute.1.Name': 'DelaySeconds',
  'Attribute.1.Value': '10',
  'Attribute.2.Name': 'MaximumMessageSize',
  'Attribute.2.Value': '131072',
  'Attribute.3.Name': 'MessageRetentionPeriod',
  'Attribute.3.Value': '259200',
  'Attribute.4.Name': 'ReceiveMessageWaitTimeSeconds',
  'Attribute.4.Value': '20',
  'Attribute.5.Name': 'RedrivePolicy',
  'Attribute.5.Value':
    '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue","maxReceiveCount":"1000"}',
  'Attribute.6.Name': 'VisibilityTimeout',
  'Attribute.6.Value': '60',
  'Attribute.7.Name': 'FifoQueue',
  'Attribute.7.Value': 'true',
  'Attribute.8.Name': 'ContentBasedDeduplication',
  'Attribute.8.Value': 'true',
  QueueUrl: 'http://localhost:3001/144505630525/jenny-test',
  Version: '2012-11-05'
};

describe('lib/actions/set-queue-attributes', () => {
  test('successfully set attributes', () => {
    expect(actionSetQueueAttributes(body)).toEqual(dedent`
    <?xml version="1.0"?>
    <SetQueueAttributesResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <ResponseMetadata>
        <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
      </ResponseMetadata>
    </SetQueueAttributesResponse>`);
  });

  test('throws error', () => {
    setQueueAttributes.mockImplementationOnce(() => {
      throw new ErrorWithCode('Mock Error', 'Mock Error');
    });
    let err1;
    try {
      actionSetQueueAttributes(body);
    } catch (err) {
      err1 = err;
    }
    expect(err1.message).toEqual('Mock Error');
    expect(err1.xml).toEqual(dedent`
    <?xml version="1.0"?>
    <ErrorResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
      <Error>
        <Code>Mock Error</Code>
        <Detail/>
        <Message>Mock Error</Message>
        <Type>Sender</Type>
      </Error>
    </ErrorResponse>`);
  });
});
