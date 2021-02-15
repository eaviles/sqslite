'use strict';

const {
  changeMessageVisibility,
  clearQueues,
  createQueue,
  deleteMessage,
  deleteMessageBatch,
  deleteQueue,
  getQueueAttributes,
  getQueueState,
  getQueueUrl,
  listDeadLetterSourceQueues,
  listQueueTags,
  listQueues,
  purgeQueue,
  receiveMessage,
  sendMessage,
  sendMessageBatch,
  setQueueAttributes,
  tagQueue,
  untagQueue
} = require('./sqs');

describe('sqs', () => {
  describe('createQueue', () => {
    afterEach(() => clearQueues());

    test('throw an error when queue name is too long', () => {
      let error;
      try {
        createQueue(
          {
            QueueName:
              '123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789-1'
          },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('successfully create queue', () => {
      expect(createQueue({ QueueName: 'foo-bar' }, 'localhost:3001')).toEqual(
        'http://localhost:3001/queues/foo-bar'
      );
    });

    test('throw an error when attempting to create fifo queue with no .fifo postfix', () => {
      let error;
      try {
        createQueue({ Attributes: { FifoQueue: true }, QueueName: 'foo-bar' }, 'localhost:3001');
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw an error when attempting to create fifo queue with no FifoQueue attribiute', () => {
      let error;
      try {
        createQueue({ QueueName: 'foo-bar.fifo' }, 'localhost:3001');
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('successfully create FifoQueue', () => {
      expect(
        createQueue(
          { Attributes: { FifoQueue: true }, QueueName: 'foo-bar.fifo' },
          'localhost:3001'
        )
      ).toEqual('http://localhost:3001/queues/foo-bar.fifo');
    });

    test('throw an error when queue name has invalid characters', () => {
      let error;
      try {
        createQueue({ QueueName: 'abc!@#' }, 'localhost:3001');
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw error when DelaySeconds is invalid value', () => {
      let error;
      try {
        createQueue(
          { Attributes: { DelaySeconds: '1000' }, QueueName: 'foo-bar' },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Invalid value for the parameter DelaySeconds.');
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw error when MaximumMessageSize is invalid value', () => {
      let error;
      try {
        createQueue(
          { Attributes: { MaximumMessageSize: 262145 }, QueueName: 'foo-bar' },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Invalid value for the parameter MaximumMessageSize.');
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw an error when MessageRetentionPeriod is invlid value', () => {
      let error;
      try {
        createQueue(
          { Attributes: { MessageRetentionPeriod: 1209601 }, QueueName: 'foo-bar' },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Invalid value for the parameter MessageRetentionPeriod.');
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw an error when ReceiveMessageWaitTimeSeconds is invalid value', () => {
      let error;
      try {
        createQueue(
          { Attributes: { ReceiveMessageWaitTimeSeconds: 21 }, QueueName: 'foo-bar' },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'Invalid value for the parameter ReceiveMessageWaitTimeSeconds.'
      );
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw an error when VisibilityTimeout is invlid value', () => {
      let error;
      try {
        createQueue(
          { Attributes: { VisibilityTimeout: 43201 }, QueueName: 'foo-bar' },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Invalid value for the parameter VisibilityTimeout.');
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw an error when RedrivcePolicy missing deadLetterQueueArn', () => {
      let error;
      try {
        createQueue(
          { Attributes: { RedrivePolicy: '{}' }, QueueName: 'foo-bar' },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw an error when RedrivePolicy missing maxReceiveCount', () => {
      let error;
      try {
        createQueue(
          {
            Attributes: { RedrivePolicy: '{ "deadLetterQueueArn": "arn" }' },
            QueueName: 'foo-bar'
          },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw an error when deadLetterTargetArn does not exist', () => {
      let error;
      try {
        createQueue(
          {
            Attributes: { RedrivePolicy: { deadLetterTargetArn: 'foo', maxReceiveCount: 10 } },
            QueueName: 'foo-bar'
          },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Value {&quot;deadLetterTargetArn&quot;:&quot;foo&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead letter target does not exist.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throws an error when deadLetterQueue exists but does not much fifo/not fifo of the queue', () => {
      createQueue({ QueueName: 'dead-letter-queue' }, 'localhost:3001');

      let error;
      try {
        createQueue(
          {
            Attributes: {
              FifoQueue: true,
              RedrivePolicy: {
                deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue',
                maxReceiveCount: 5
              }
            },
            QueueName: 'foo-with-dlq.fifo'
          },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:queues:dead-letter-queue&quot;,&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Dead-letter target owner should be same as the source.'
      );
      expect(error.code).toEqual('InvalidParameterValue');
    });

    test('throw error when deadLetterTargerArd does not exist in list of queues', () => {
      createQueue(
        {
          Attributes: { FifoQueue: true },
          QueueName: 'dead-letter-queue1.fifo'
        },
        'localhost:3001'
      );

      let error;
      try {
        createQueue(
          {
            Attributes: {
              FifoQueue: true,
              RedrivePolicy: {
                deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue2.fifo',
                maxReceiveCount: 5
              }
            },
            QueueName: 'foo-with-dlq.fifo'
          },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:queues:dead-letter-queue2.fifo&quot;,&quot;maxReceiveCount&quot;:&quot;3&quot;} for parameter RedrivePolicy is invalid. Reason: Dead letter target does not exist.'
      );
    });

    test('throw error when attempting to create queue with existing name but different RedrivePolicy deadLettterTargetArn', () => {
      createQueue({ QueueName: 'dead-letter-queue1' }, 'localhost:3001');
      createQueue({ QueueName: 'dead-letter-queue2' }, 'localhost:3001');
      createQueue({
        Attributes: {
          RedrivePolicy: {
            deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue1',
            maxReceiveCount: '10'
          }
        },
        QueueName: 'foo-bar'
      });
      expect(() =>
        createQueue(
          {
            Attributes: {
              RedrivePolicy: {
                deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue2',
                maxReceiveCount: '10'
              }
            },
            QueueName: 'foo-bar'
          },
          'localhost:3001'
        )
      ).toThrow(
        'A queue already exists with the same name and a different value for attribute RedrivePolicy'
      );
    });

    test('throw error when attempting to create queue with existing name but different RedrivePolicy maxReceiveCount', () => {
      createQueue({ QueueName: 'dead-letter-queue1' }, 'localhost:3001');
      createQueue(
        {
          Attributes: {
            RedrivePolicy: {
              deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue1',
              maxReceiveCount: '5'
            }
          },
          QueueName: 'foo-bar'
        },
        'localhost:3001'
      );
      expect(() =>
        createQueue(
          {
            Attributes: {
              RedrivePolicy: {
                deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue1',
                maxReceiveCount: '10'
              }
            },
            QueueName: 'foo-bar'
          },
          'localhost:3001'
        )
      ).toThrow(
        'A queue already exists with the same name and a different value for attribute RedrivePolicy'
      );
    });

    test('create queue with the same name and identical RedrivePolicy', () => {
      createQueue({ QueueName: 'dead-letter-queue1' }, 'localhost:3001');
      createQueue(
        {
          Attributes: {
            RedrivePolicy: {
              deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue1',
              maxReceiveCount: '10'
            }
          },
          QueueName: 'foo-bar'
        },
        'localhost:3001'
      );
      expect(
        createQueue(
          {
            Attributes: {
              RedrivePolicy: {
                deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue1',
                maxReceiveCount: '10'
              }
            },
            QueueName: 'foo-bar'
          },
          'localhost:3001'
        )
      ).toEqual('http://localhost:3001/queues/foo-bar');
    });

    test('successfully set redrive policy', () => {
      createQueue(
        {
          Attributes: { FifoQueue: true },
          QueueName: 'dead-letter-queue1.fifo'
        },
        'localhost:3001'
      );
      expect(
        createQueue(
          {
            Attributes: {
              FifoQueue: true,
              RedrivePolicy: {
                deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:dead-letter-queue1.fifo',
                maxReceiveCount: 5
              }
            },
            QueueName: 'foo-with-dlq.fifo'
          },
          'localhost:3001'
        )
      ).toEqual('http://localhost:3001/queues/foo-with-dlq.fifo');
    });

    test('throw error when KmsMasterKeyId is not set correctly', () => {
      expect(
        createQueue(
          { Attributes: { KmsMasterKeyId: 'foo' }, QueueName: 'foo-bar12' },
          'localhost:3001'
        )
      ).toEqual('http://localhost:3001/queues/foo-bar12');
    });

    test('throw error when KmsDataKeyReusePeriodSeconds is not set correctly', () => {
      let error;
      try {
        createQueue(
          { Attributes: { KmsDataKeyReusePeriodSeconds: 86401 }, QueueName: 'foo-bar' },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(
        'Invalid value for the parameter KmsDataKeyReusePeriodSeconds.'
      );
      expect(error.code).toEqual('InvalidAttributeValue');
    });

    test('throw error when attempting to set ContentBasedDeduplication, with a non FIFO queue', () => {
      let error;
      try {
        createQueue(
          { Attributes: { ContentBasedDeduplication: true }, QueueName: 'foo-bar' },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('Unknown Attribute ContentBasedDeduplication.');
    });

    test('successfully create queue with tags', () => {
      expect(
        createQueue({ QueueName: 'foo-bar-with-tags', tags: { foo: 'bar' } }, 'localhost:3001')
      ).toEqual('http://localhost:3001/queues/foo-bar-with-tags');
    });

    test('error when trying to create duplicate queue with different params', () => {
      createQueue(
        { Attributes: { DelaySeconds: 100 }, QueueName: 'test-duplicate' },
        'localhost:3001'
      );

      let error;
      try {
        createQueue(
          {
            Attributes: { DelaySeconds: 100, VisibilityTimeout: 500 },
            QueueName: 'test-duplicate'
          },
          'localhost:3001'
        );
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(
        'A queue already exists with the same name and a different value for attribute VisibilityTimeout'
      );
    });
  });

  describe('listQueues', () => {
    afterEach(() => clearQueues());
    test('list all queues when list is empty', () => {
      expect(listQueues()).toEqual([]);
    });

    test('list all queues when list has queues', () => {
      createQueue({ QueueName: 'foo-bar1' }, 'localhost:3000');
      createQueue({ QueueName: 'foo-bar2' }, 'localhost:3000');
      expect(listQueues()).toEqual(['foo-bar1', 'foo-bar2']);
    });
  });

  describe('sendMessage', () => {
    test('throw error when queue does not exist', () => {
      let error;
      try {
        sendMessage({ QueueUrl: 'http://localhost:3000/queues/foo' });
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
      expect(error.code).toEqual('AWS.SimpleQueueService.NonExistentQueue');
    });

    test('successfully send message when queue has no messages', () => {
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      expect(
        sendMessage({
          MessageBody: 'some message',
          QueueUrl: 'http://localhost:3000/queues/foo-bar'
        })
      ).toEqual({
        MD5OfMessageBody: expect.any(String),
        MessageId: expect.any(String)
      });
    });

    test('successfully send message when queue has messages', () => {
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      sendMessage({
        MessageBody: 'first message',
        QueueUrl: 'http://localhost:3000/queues/foo-bar'
      });
      expect(
        sendMessage({
          MessageBody: 'second message',
          QueueUrl: 'http://localhost:3000/queues/foo-bar'
        })
      ).toEqual({
        MD5OfMessageBody: expect.any(String),
        MessageId: expect.any(String)
      });
    });

    test('Change availability for duplicate messages by 5 minutes', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar.fifo';
      createQueue(
        {
          Attributes: { ContentBasedDeduplication: true, FifoQueue: true },
          QueueName: 'foo-bar.fifo'
        },
        'localhost:3000'
      );

      sendMessage({ MessageBody: 'foo1', MessageGroupId: '111', QueueUrl });
      sendMessage({ MessageBody: 'foo1', MessageGroupId: '111', QueueUrl });

      const { messages } = getQueueState(QueueUrl);
      const firstSentTimeStamp = messages[0].Attributes.SentTimestamp;
      const secondSentTimeStamp = messages[1].Attributes.SentTimestamp;
      const firstAvailableSince = messages[0].Attributes.AvailableSince;
      const secondAvailableSince = messages[1].Attributes.AvailableSince;
      const FIVE_MIN = 5 * 60 * 1000;
      expect(firstSentTimeStamp).toEqual(firstAvailableSince);
      expect(secondSentTimeStamp).not.toEqual(secondAvailableSince);
      expect(secondAvailableSince - secondSentTimeStamp).toEqual(FIVE_MIN);

      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: true,
          CreatedTimestamp: expect.any(Number),
          DelaySeconds: 0,
          FifoQueue: true,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar.fifo',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo1',
            MessageGroupId: '111',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo1',
            MessageGroupId: '111',
            MessageId: expect.any(String)
          }
        ],
        tags: {}
      });
    });

    test('Change availability for messages that have same MessageDeduplicationId', () => {
      const QueueName = 'foo-bar.fifo';
      const QueueUrl = `http://localhost:3000/queues/${QueueName}`;
      createQueue(
        {
          Attributes: { ContentBasedDeduplication: true, FifoQueue: true },
          QueueName
        },
        'localhost:3000'
      );
      sendMessage({
        MessageBody: 'foo1',
        MessageDeduplicationId: '12345',
        MessageGroupId: '111',
        QueueUrl
      });
      sendMessage({
        MessageBody: 'foo2',
        MessageDeduplicationId: '12345',
        MessageGroupId: '111',
        QueueUrl
      });
      sendMessage({
        MessageBody: 'foo2',
        MessageDeduplicationId: '12346',
        MessageGroupId: '111',
        QueueUrl
      });
      const { messages } = getQueueState(QueueUrl);
      const firstSentTimeStamp = messages[0].Attributes.SentTimestamp;
      const secondSentTimeStamp = messages[1].Attributes.SentTimestamp;
      const thirdSentTimeStamp = messages[2].Attributes.SentTimestamp;
      const firstAvailableSince = messages[0].Attributes.AvailableSince;
      const secondAvailableSince = messages[1].Attributes.AvailableSince;
      const thirdAvailableSince = messages[2].Attributes.AvailableSince;
      const FIVE_MIN = 5 * 60 * 1000;
      expect(firstSentTimeStamp).toEqual(firstAvailableSince);
      expect(secondSentTimeStamp).not.toEqual(secondAvailableSince);
      expect(secondAvailableSince - secondSentTimeStamp).toEqual(FIVE_MIN);
      expect(thirdSentTimeStamp).toEqual(thirdAvailableSince);
    });

    describe('MessageAttributes', () => {
      test('send message', () => {
        expect(
          sendMessage({
            MessageAttributes: {
              City: {
                DataType: 'String',
                StringValue: 'Any City'
              },
              Greeting: {
                BinaryValue: 'Hello, World!',
                DataType: 'Binary'
              }
            },
            MessageBody: 'foo',
            MessageGroupId: '1111',
            QueueUrl: 'http://localhost:0000/queues/foo-bar'
          })
        ).toEqual({
          MD5OfMessageAttributes: '3449c9e5e332f1dbb81505cd739fbf3f',
          MD5OfMessageBody: expect.any(String),
          MessageId: expect.any(String)
        });
      });
    });

    describe('MessageSystemAttributes', () => {
      test('send message', () => {
        expect(
          sendMessage({
            MessageBody: 'foo',
            MessageGroupId: '1111',
            MessageSystemAttributes: {
              AWSTraceHeader: {
                DataType: 'String',
                StringValue: 'Foo=bar&baz=qux'
              }
            },
            QueueUrl: 'http://localhost:0000/queues/foo-bar'
          })
        ).toEqual({
          MD5OfMessageBody: expect.any(String),
          MD5OfMessageSystemAttributes: '3449c9e5e332f1dbb81505cd739fbf3f',
          MessageId: expect.any(String)
        });
      });
    });

    describe('DelaySeconds', () => {
      test('set custom DelaySeconds attribute for message', () => {
        createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
        expect(
          sendMessage({
            DelaySeconds: 20,
            MessageBody: 'foo',
            QueueUrl: 'http://localhost:3000/queues/foo-bar'
          })
        ).toEqual({
          DelaySeconds: 20,
          MD5OfMessageBody: expect.any(String),
          MessageId: expect.any(String)
        });
      });

      test('dont set DelaySeconds attribute for message when not passed explicitly, but set on creation', () => {
        createQueue({ Attributes: { DelaySeconds: 30 }, QueueName: 'foo-bar' }, 'localhost:3000');
        expect(
          sendMessage({
            MessageBody: 'foo',
            QueueUrl: 'http://localhost:3000/queues/foo-bar'
          })
        ).toEqual({
          MD5OfMessageBody: expect.any(String),
          MessageId: expect.any(String)
        });
      });

      test('set custom DelaySeconds attribute for message for Fifo queue', () => {
        createQueue(
          {
            Attributes: { ContentBasedDeduplication: true, DelaySeconds: 200, FifoQueue: true },
            QueueName: 'foo-bar.fifo'
          },
          'localhost:3000'
        );
        expect(
          sendMessage({
            MessageBody: 'foo',
            MessageGroupId: '111',
            QueueUrl: 'foo-bar.fifo'
          })
        ).toEqual({
          DelaySeconds: 200,
          MD5OfMessageBody: expect.any(String),
          MessageId: expect.any(String)
        });
      });

      test('set default DelaySeconds attribute for message for Fifo queue', () => {
        createQueue(
          {
            Attributes: { ContentBasedDeduplication: true, FifoQueue: true },
            QueueName: 'foo-bar.fifo'
          },
          'localhost:3000'
        );
        expect(
          sendMessage({
            MessageBody: 'foo',
            MessageGroupId: '111',
            QueueUrl: 'foo-bar.fifo'
          })
        ).toEqual({
          MD5OfMessageBody: expect.any(String),
          MessageId: expect.any(String)
        });
      });

      test('throw error when FifoQueue missing MessageGroupId when sending message', () => {
        createQueue(
          {
            Attributes: { ContentBasedDeduplication: true, FifoQueue: true },
            QueueName: 'foo-bar.fifo'
          },
          'localhost:3000'
        );
        expect(() =>
          sendMessage({
            MessageBody: 'foo',
            QueueUrl: 'foo-bar.fifo'
          })
        ).toThrow('The request must contain the parameter MessageGroupId.');
      });

      test('send message with MessageDeduplicationId', () => {
        createQueue(
          {
            Attributes: { FifoQueue: true },
            QueueName: 'foo-bar.fifo'
          },
          'localhost:3000'
        );
        expect(
          sendMessage({
            MessageBody: 'foo',
            MessageDeduplicationId: '2222',
            MessageGroupId: '1111',
            QueueUrl: 'foo-bar.fifo'
          })
        ).toEqual({
          MD5OfMessageBody: expect.any(String),
          MessageDeduplicationId: '2222',
          MessageId: expect.any(String),
          SequenceNumber: '00000000000000000000'
        });
      });
    });
  });

  describe('sendMessageBatch', () => {
    test('successfully send message batch', () => {
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      expect(
        sendMessageBatch({
          QueueUrl: 'http://localhost:3000/queues/foo-bar',
          messages: [
            {
              DelaySeconds: 10,
              Id: 'FuelReport-0001-2015-09-16T140731Z',

              MessageAttributes: {
                City: {
                  DataType: 'String',
                  StringValue: 'Any City'
                },
                PostalCode: {
                  DataType: 'String',
                  StringValue: '99065'
                },
                PricePerGallon: {
                  DataType: 'Number',
                  StringValue: '1.99'
                },
                Region: {
                  DataType: 'String',
                  StringValue: 'WA'
                },
                SellerName: {
                  DataType: 'String',
                  StringValue: 'Example Store'
                }
              },
              MessageBody: 'Fuel report for account 0001 on 2015-09-16 at 02:07:31 PM.'
            },
            {
              DelaySeconds: 10,
              Id: 'FuelReport-0002-2015-09-16T140930Z',
              MessageAttributes: {
                City: {
                  DataType: 'String',
                  StringValue: 'North Town'
                },
                PostalCode: {
                  DataType: 'String',
                  StringValue: '99123'
                },
                PricePerGallon: {
                  DataType: 'Number',
                  StringValue: '1.87'
                },
                Region: {
                  DataType: 'String',
                  StringValue: 'WA'
                },
                SellerName: {
                  DataType: 'String',
                  StringValue: 'Example Fuels'
                }
              },
              MessageBody: 'Fuel report for account 0002 on 2015-09-16 at 02:09:30 PM.'
            }
          ]
        })
      ).toEqual([
        {
          Id: 'a7c4d239cf2aeb107bffde4fcc803d82',
          MD5OfMessageAttributes: '10809b55e3d9b22c17220b7dbaf283ef',
          MDOfMessageBody: '203c4a38f1cee1cb10269e847943237e',
          MessageId: expect.any(String)
        },
        {
          Id: '4109206ec8f49219951187404de88547',
          MD5OfMessageAttributes: '556239281d7bf8f3723977ecae354a25',
          MDOfMessageBody: '2cf0159a0e5f31ee03a9c556c1980595',
          MessageId: expect.any(String)
        }
      ]);
    });

    test('Change availability for duplicate messages by 5 minutes when MessageDeduplicationId is passed', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar.fifo';
      createQueue(
        {
          Attributes: { ContentBasedDeduplication: true, FifoQueue: true },
          QueueName: 'foo-bar.fifo'
        },
        'localhost:3000'
      );
      // TODO: Id mandatory?

      sendMessageBatch({
        QueueUrl,
        messages: [
          { Id: '1', MessageBody: 'foo1', MessageDeduplicationId: '12345', MessageGroupId: '111' }
        ]
      });
      sendMessageBatch({
        QueueUrl,
        messages: [
          { Id: '2', MessageBody: 'foo2', MessageDeduplicationId: '12345', MessageGroupId: '111' }
        ]
      });
      sendMessageBatch({
        QueueUrl,
        messages: [
          { Id: '3', MessageBody: 'foo2', MessageDeduplicationId: '12346', MessageGroupId: '111' }
        ]
      });
      const { messages } = getQueueState(QueueUrl);

      const firstSentTimeStamp = messages[0].Attributes.SentTimestamp;
      const secondSentTimeStamp = messages[1].Attributes.SentTimestamp;
      const thirdSentTimeStamp = messages[2].Attributes.SentTimestamp;
      const firstAvailableSince = messages[0].Attributes.AvailableSince;
      const secondAvailableSince = messages[1].Attributes.AvailableSince;
      const thirdAvailableSince = messages[2].Attributes.AvailableSince;
      const FIVE_MIN = 5 * 60 * 1000;
      expect(firstSentTimeStamp).toEqual(firstAvailableSince);
      expect(secondSentTimeStamp).not.toEqual(secondAvailableSince);
      expect(secondAvailableSince - secondSentTimeStamp).toEqual(FIVE_MIN);
      expect(thirdSentTimeStamp).toEqual(thirdAvailableSince);

      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: true,
          CreatedTimestamp: expect.any(Number),
          DelaySeconds: 0,
          FifoQueue: true,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar.fifo',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            Id: '1',
            MessageBody: 'foo1',
            MessageDeduplicationId: '12345',
            MessageGroupId: '111',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            Id: '2',
            MessageBody: 'foo2',
            MessageDeduplicationId: '12345',
            MessageGroupId: '111',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            Id: '3',
            MessageBody: 'foo2',
            MessageDeduplicationId: '12346',
            MessageGroupId: '111',
            MessageId: expect.any(String)
          }
        ],
        tags: {}
      });
    });

    test('Change availability for duplicate messages by 5 minutes batch', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar.fifo';
      createQueue(
        {
          Attributes: { ContentBasedDeduplication: true, FifoQueue: true },
          QueueName: 'foo-bar.fifo'
        },
        'localhost:3000'
      );
      // TODO: Id mandatory?

      sendMessageBatch({
        QueueUrl,
        messages: [{ Id: '1', MessageBody: 'foo1', MessageGroupId: '111' }]
      });

      sendMessageBatch({
        QueueUrl,
        messages: [{ Id: '2', MessageBody: 'foo1', MessageGroupId: '111' }]
      });
      const { messages } = getQueueState(QueueUrl);

      const firstSentTimeStamp = messages[0].Attributes.SentTimestamp;
      const secondSentTimeStamp = messages[1].Attributes.SentTimestamp;
      const firstAvailableSince = messages[0].Attributes.AvailableSince;
      const secondAvailableSince = messages[1].Attributes.AvailableSince;
      const FIVE_MIN = 5 * 60 * 1000;
      expect(firstSentTimeStamp).toEqual(firstAvailableSince);
      expect(secondSentTimeStamp).not.toEqual(secondAvailableSince);
      expect(secondAvailableSince - secondSentTimeStamp).toEqual(FIVE_MIN);

      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: true,
          CreatedTimestamp: expect.any(Number),
          DelaySeconds: 0,
          FifoQueue: true,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar.fifo',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            Id: '1',
            MessageBody: 'foo1',
            MessageGroupId: '111',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            Id: '2',
            MessageBody: 'foo1',
            MessageGroupId: '111',
            MessageId: expect.any(String)
          }
        ],
        tags: {}
      });
    });

    test('throw error when queue does not exist', () => {
      let error;
      try {
        sendMessageBatch({ QueueUrl: 'http://localhost:3000/queues/foo', messages: [] });
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
      expect(error.code).toEqual('AWS.SimpleQueueService.NonExistentQueue');
    });
  });

  describe('receiveMessage', () => {
    afterEach(() => clearQueues());
    test('throw error when queue does not exist', () => {
      let error;
      try {
        receiveMessage({ QueueUrl: 'http://localhost:3000/queues/foo' });
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
      expect(error.code).toEqual('AWS.SimpleQueueService.NonExistentQueue');
    });

    test('successfully receive message', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      sendMessage({ MessageBody: 'foo', QueueUrl });
      expect(receiveMessage({ QueueUrl })).toEqual([
        {
          Body: 'foo',
          MD5OfBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: false,
          CreatedTimestamp: expect.anything(),
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo',
            MessageId: expect.any(String)
          }
        ],
        tags: {}
      });
    });

    test('successfully receive message visibility timeout', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      sendMessage({ MessageBody: 'foo', QueueUrl });
      expect(
        receiveMessage({
          QueueUrl,
          VisibilityTimeout: 3
        })
      ).toEqual([
        {
          Body: 'foo',
          MD5OfBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: false,
          CreatedTimestamp: expect.anything(),
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), VisibilityTimeout: 3, isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo',
            MessageId: expect.any(String)
          }
        ],
        tags: {}
      });
    });

    test('successfully receive multiple messages', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      sendMessage({ MessageBody: 'foo1', QueueUrl });
      sendMessage({ MessageBody: 'foo2', QueueUrl });
      sendMessage({ MessageBody: 'foo3', QueueUrl });
      sendMessage({ MessageBody: 'foo4', QueueUrl });
      sendMessage({ MessageBody: 'foo5', QueueUrl });
      expect(receiveMessage({ MaxNumberOfMessages: 3, QueueUrl, VisibilityTimeout: 2 })).toEqual([
        {
          Body: 'foo1',
          MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        },
        {
          Body: 'foo2',
          MD5OfBody: '92e0057157f69e22a364d6b22dd6bbd5',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        },
        {
          Body: 'foo3',
          MD5OfBody: 'cecf7c1a4c5640928a3a73459bb3d977',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: false,
          CreatedTimestamp: expect.anything(),
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), VisibilityTimeout: 2, isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo1',
            MessageId: expect.any(String)
          },
          {
            '@State': { ReceiptHandle: expect.any(String), VisibilityTimeout: 2, isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo2',
            MessageId: expect.any(String)
          },
          {
            '@State': { ReceiptHandle: expect.any(String), VisibilityTimeout: 2, isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo3',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo4',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo5',
            MessageId: expect.any(String)
          }
        ],
        tags: {}
      });
    });

    test('successfully receive multiple messages when there are less messages than requested', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      sendMessage({ MessageBody: 'foo1', QueueUrl });
      sendMessage({ MessageBody: 'foo2', QueueUrl });
      expect(receiveMessage({ MaxNumberOfMessages: 3, QueueUrl })).toEqual([
        {
          Body: 'foo1',
          MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        },
        {
          Body: 'foo2',
          MD5OfBody: '92e0057157f69e22a364d6b22dd6bbd5',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: false,
          CreatedTimestamp: expect.anything(),
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo1',
            MessageId: expect.any(String)
          },
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo2',
            MessageId: expect.any(String)
          }
        ],
        tags: {}
      });
    });

    test('successfully receive message with message attribute All', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');

      sendMessage({
        MessageAttributes: {
          City: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          Greeting: {
            BinaryValue: 'Hello, World!',
            DataType: 'Binary'
          },
          Population: {
            DataType: 'Number',
            StringValue: '1250800'
          }
        },
        MessageBody: 'foo1',
        QueueUrl
      });
      expect(receiveMessage({ MessageAttributeNames: ['All'], QueueUrl })).toEqual([
        {
          Body: 'foo1',
          MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
          MD5OfMessageAttributes: 'b1c94ca2fbc3e78fc30069c8d0f01680',
          MessageAttributes: {
            City: {
              DataType: 'String',
              StringValue: 'Any City'
            },
            Greeting: {
              BinaryValue: 'Hello, World!',
              DataType: 'Binary'
            },
            Population: {
              DataType: 'Number',
              StringValue: '1250800'
            }
          },
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: false,
          CreatedTimestamp: expect.anything(),
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageAttributes: {
              City: {
                DataType: 'String',
                StringValue: 'Any City'
              },
              Greeting: {
                BinaryValue: 'Hello, World!',
                DataType: 'Binary'
              },
              Population: {
                DataType: 'Number',
                StringValue: '1250800'
              }
            },
            MessageBody: 'foo1',
            MessageId: expect.any(String)
          }
        ],
        tags: {}
      });
    });

    test('successfully receive message with message attributes that exist and dont exist', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      sendMessage({
        MessageAttributes: {
          City: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          Greeting: {
            BinaryValue: 'Hello, World!',
            DataType: 'Binary'
          },
          Population: {
            DataType: 'Number',
            StringValue: '1250800'
          }
        },
        MessageBody: 'foo1',
        QueueUrl
      });
      expect(receiveMessage({ MessageAttributeNames: ['Greeting', 'Foo'], QueueUrl })).toEqual([
        {
          Body: 'foo1',
          MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
          MD5OfMessageAttributes: '386f7371cc7c4504e61355ec5fdcee4b',
          MessageAttributes: {
            Greeting: {
              BinaryValue: 'Hello, World!',
              DataType: 'Binary'
            }
          },
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: false,
          CreatedTimestamp: expect.anything(),
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageAttributes: {
              City: {
                DataType: 'String',
                StringValue: 'Any City'
              },
              Greeting: {
                BinaryValue: 'Hello, World!',
                DataType: 'Binary'
              },
              Population: {
                DataType: 'Number',
                StringValue: '1250800'
              }
            },
            MessageBody: 'foo1',
            MessageId: expect.any(String)
          }
        ],
        tags: {}
      });
    });

    test('successfully receive message with attribute All', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      sendMessage({
        MessageAttributes: {
          City: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          Greeting: {
            BinaryValue: 'Hello, World!',
            DataType: 'Binary'
          },
          Population: {
            DataType: 'Number',
            StringValue: '1250800'
          }
        },
        MessageBody: 'foo1',
        QueueUrl
      });
      expect(receiveMessage({ AttributeNames: ['All'], QueueUrl })).toEqual([
        {
          Attributes: {
            ApproximateFirstReceiveTimestamp: expect.any(Number),
            ApproximateReceiveCount: 1,
            AvailableSince: expect.any(Number),
            SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
            SentTimestamp: expect.any(Number)
          },
          Body: 'foo1',
          MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: false,
          CreatedTimestamp: expect.anything(),
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageAttributes: {
              City: {
                DataType: 'String',
                StringValue: 'Any City'
              },
              Greeting: {
                BinaryValue: 'Hello, World!',
                DataType: 'Binary'
              },
              Population: {
                DataType: 'Number',
                StringValue: '1250800'
              }
            },
            MessageBody: 'foo1',
            MessageId: expect.any(String)
          }
        ],
        tags: {}
      });
    });

    test('successfully receive message with select attributes', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      sendMessage({
        MessageAttributes: {
          City: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          Greeting: {
            BinaryValue: 'Hello, World!',
            DataType: 'Binary'
          },
          Population: {
            DataType: 'Number',
            StringValue: '1250800'
          }
        },
        MessageBody: 'foo1',
        QueueUrl
      });
      expect(
        receiveMessage({ AttributeNames: ['SenderId', 'SentTimestamp', 'Foo'], QueueUrl })
      ).toEqual([
        {
          Attributes: {
            SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
            SentTimestamp: expect.any(Number)
          },
          Body: 'foo1',
          MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
          MessageId: expect.any(String),
          ReceiptHandle: expect.any(String)
        }
      ]);
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: false,
          CreatedTimestamp: expect.anything(),
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageAttributes: {
              City: {
                DataType: 'String',
                StringValue: 'Any City'
              },
              Greeting: {
                BinaryValue: 'Hello, World!',
                DataType: 'Binary'
              },
              Population: {
                DataType: 'Number',
                StringValue: '1250800'
              }
            },
            MessageBody: 'foo1',
            MessageId: expect.any(String)
          }
        ],
        tags: {}
      });
    });

    describe('fifo', () => {
      test('receive message using fifo queue with ContentBasedDeduplication disabled', () => {
        const QueueUrl = 'http://localhost:3000/queues/foo-bar.fifo';
        createQueue(
          { Attributes: { FifoQueue: true }, QueueName: 'foo-bar.fifo' },
          'localhost:3000'
        );
        sendMessage({ MessageBody: 'foo1', MessageGroupId: '1111', QueueUrl });
        sendMessage({ MessageBody: 'foo2', MessageGroupId: '2222', QueueUrl });
        sendMessage({ MessageBody: 'foo3', MessageGroupId: '1111', QueueUrl });
        sendMessage({ MessageBody: 'foo4', MessageGroupId: '2222', QueueUrl });
        sendMessage({ MessageBody: 'foo5', MessageGroupId: '1111', QueueUrl });
        expect(receiveMessage({ QueueUrl })).toEqual([
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ]);
        expect(getQueueState(QueueUrl).messages).toEqual([
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo1',
            MessageGroupId: '1111',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo2',
            MessageGroupId: '2222',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo3',
            MessageGroupId: '1111',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo4',
            MessageGroupId: '2222',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo5',
            MessageGroupId: '1111',
            MessageId: expect.any(String)
          }
        ]);
      });

      test('receive message using fifo queue with ContentBasedDeduplication disabled and MaxNumberOfMessages set to max', () => {
        const QueueUrl = 'http://localhost:3000/queues/foo-bar-123abc.fifo';
        createQueue(
          { Attributes: { FifoQueue: true }, QueueName: 'foo-bar-123abc.fifo' },
          'localhost:3000'
        );
        sendMessageBatch({
          QueueUrl,
          messages: [
            { Id: '1', MessageBody: 'foo1', MessageGroupId: '1111', QueueUrl },
            { Id: '2', MessageBody: 'foo2', MessageGroupId: '2222', QueueUrl },
            { Id: '3', MessageBody: 'foo3', MessageGroupId: '1111', QueueUrl },
            { Id: '4', MessageBody: 'foo4', MessageGroupId: '2222', QueueUrl },
            { Id: '5', MessageBody: 'foo5', MessageGroupId: '1111', QueueUrl }
          ]
        });

        expect(receiveMessage({ MaxNumberOfMessages: 10, QueueUrl })).toEqual([
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          },
          {
            Body: 'foo3',
            MD5OfBody: 'cecf7c1a4c5640928a3a73459bb3d977',
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          },
          {
            Body: 'foo5',
            MD5OfBody: '989beaf85b1ee11a83eba52b29635e5e',
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ]);

        expect(getQueueState(QueueUrl).messages).toEqual([
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            Id: '1',
            MessageBody: 'foo1',
            MessageGroupId: '1111',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            Id: '2',
            MessageBody: 'foo2',
            MessageGroupId: '2222',
            MessageId: expect.any(String)
          },
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            Id: '3',
            MessageBody: 'foo3',
            MessageGroupId: '1111',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            Id: '4',
            MessageBody: 'foo4',
            MessageGroupId: '2222',
            MessageId: expect.any(String)
          },
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            Id: '5',
            MessageBody: 'foo5',
            MessageGroupId: '1111',
            MessageId: expect.any(String)
          }
        ]);
      });

      test('receive empty response when there are no unread messages to receive', () => {
        const QueueUrl = 'http://localhost:3000/queues/foo-bar-abc.fifo';
        createQueue(
          { Attributes: { FifoQueue: true }, QueueName: 'foo-bar-abc.fifo' },
          'localhost:3000'
        );
        sendMessage({ MessageBody: 'foo1', MessageGroupId: '1111', QueueUrl });
        sendMessage({ MessageBody: 'foo2', MessageGroupId: '1111', QueueUrl });
        expect(getQueueState(QueueUrl).messages).toEqual([
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo1',
            MessageGroupId: '1111',
            MessageId: expect.any(String)
          },
          {
            '@State': { isRead: false },
            Attributes: {
              ApproximateFirstReceiveTimestamp: '',
              ApproximateReceiveCount: 0,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo2',
            MessageGroupId: '1111',
            MessageId: expect.any(String)
          }
        ]);
        expect(receiveMessage({ MaxNumberOfMessages: 10, QueueUrl })).toEqual([
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          },
          {
            Body: 'foo2',
            MD5OfBody: '92e0057157f69e22a364d6b22dd6bbd5',
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ]);
        expect(getQueueState(QueueUrl).messages).toEqual([
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo1',
            MessageGroupId: '1111',
            MessageId: expect.any(String)
          },
          {
            '@State': { ReceiptHandle: expect.any(String), isRead: true },
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.any(Number),
              ApproximateReceiveCount: 1,
              AvailableSince: expect.any(Number),
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.any(Number)
            },
            MessageBody: 'foo2',
            MessageGroupId: '1111',
            MessageId: expect.any(String)
          }
        ]);
        expect(receiveMessage({ MaxNumberOfMessages: 10, QueueUrl })).toEqual([]);
      });
    });
  });

  describe('deleteMessage', () => {
    afterEach(() => clearQueues());
    test('successfully delete message', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      sendMessage({
        MessageAttributes: {
          City: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          Greeting: {
            BinaryValue: 'Hello, World!',
            DataType: 'Binary'
          },
          Population: {
            DataType: 'Number',
            StringValue: '1250800'
          }
        },
        MessageBody: 'foo1',
        QueueUrl
      });
      const Messages = receiveMessage({
        AttributeNames: ['SenderId', 'SentTimestamp', 'Foo'],
        QueueUrl
      });

      expect(getQueueState(QueueUrl).messages).toEqual([
        {
          '@State': { ReceiptHandle: expect.any(String), isRead: true },
          Attributes: {
            ApproximateFirstReceiveTimestamp: expect.any(Number),
            ApproximateReceiveCount: 1,
            AvailableSince: expect.any(Number),
            SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
            SentTimestamp: expect.any(Number)
          },
          MessageAttributes: {
            City: { DataType: 'String', StringValue: 'Any City' },
            Greeting: { BinaryValue: 'Hello, World!', DataType: 'Binary' },
            Population: { DataType: 'Number', StringValue: '1250800' }
          },
          MessageBody: 'foo1',
          MessageId: expect.any(String)
        }
      ]);
      deleteMessage({ QueueUrl, ReceiptHandle: Messages[0].ReceiptHandle });
      expect(getQueueState(QueueUrl).messages).toEqual([]);
    });

    test('queue does not exist', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      sendMessage({
        MessageAttributes: {
          City: {
            DataType: 'String',
            StringValue: 'Any City'
          },
          Greeting: {
            BinaryValue: 'Hello, World!',
            DataType: 'Binary'
          },
          Population: {
            DataType: 'Number',
            StringValue: '1250800'
          }
        },
        MessageBody: 'foo1',
        QueueUrl
      });
      const Messages = receiveMessage({
        AttributeNames: ['SenderId', 'SentTimestamp', 'Foo'],
        QueueUrl
      });

      let err1;

      try {
        deleteMessage({
          QueueUrl: 'http://localhost:3000/queues/foo-bar-does-not-exist',
          ReceiptHandle: Messages[0].ReceiptHandle
        });
      } catch (err) {
        err1 = err;
      }
      expect(err1.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });
  });

  describe('deleteMessageBatch', () => {
    afterEach(() => clearQueues());

    test('queue does not exist', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';

      let err1;
      try {
        deleteMessageBatch(QueueUrl, { Entries: [{ Id: '123', ReceiptHandle: 'foobar' }] });
      } catch (err) {
        err1 = err;
      }
      expect(err1.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });

    test('successfully delete multiple messages', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      sendMessage({ MessageBody: 'foo1', QueueUrl });
      sendMessage({ MessageBody: 'foo2', QueueUrl });
      sendMessage({ MessageBody: 'foo3', QueueUrl });
      sendMessage({ MessageBody: 'foo4', QueueUrl });
      sendMessage({ MessageBody: 'foo5', QueueUrl });

      const Entries = [];

      const Messages1 = receiveMessage({ QueueUrl });
      Entries.push({ Id: Messages1[0].MessageId, ReceiptHandle: Messages1[0].ReceiptHandle });
      expect(getQueueState(QueueUrl).messages.filter((msg) => msg['@State'].isRead).length).toBe(1);

      const Messages2 = receiveMessage({ QueueUrl });
      Entries.push({ Id: Messages2[0].MessageId, ReceiptHandle: Messages2[0].ReceiptHandle });
      expect(getQueueState(QueueUrl).messages.filter((msg) => msg['@State'].isRead).length).toBe(2);

      const Messages3 = receiveMessage({ QueueUrl });
      Entries.push({ Id: Messages3[0].MessageId, ReceiptHandle: Messages3[0].ReceiptHandle });
      expect(getQueueState(QueueUrl).messages.filter((msg) => msg['@State'].isRead).length).toBe(3);

      const Messages4 = receiveMessage({ QueueUrl });
      Entries.push({ Id: Messages4[0].MessageId, ReceiptHandle: Messages4[0].ReceiptHandle });
      expect(getQueueState(QueueUrl).messages.filter((msg) => msg['@State'].isRead).length).toBe(4);

      const Messages5 = receiveMessage({ QueueUrl });
      Entries.push({ Id: Messages5[0].MessageId, ReceiptHandle: Messages5[0].ReceiptHandle });
      expect(getQueueState(QueueUrl).messages.filter((msg) => msg['@State'].isRead).length).toBe(5);

      expect(deleteMessageBatch(QueueUrl, Entries).length).toBe(5);
    });
  });

  describe('deleteQueue', () => {
    afterEach(() => clearQueues());
    test('successfully delete queue', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      expect(getQueueState(QueueUrl)).toEqual({
        '@State': {},
        Attributes: {
          ContentBasedDeduplication: false,
          CreatedTimestamp: expect.anything(),
          DelaySeconds: 0,
          FifoQueue: false,
          KmsDataKeyReusePeriodSeconds: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          MaximumMessageSize: 262144,
          MessageRetentionPeriod: 345600,
          QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar',
          ReceiveMessageWaitTimeSeconds: 0,
          RedrivePolicy: undefined,
          VisibilityTimeout: 30
        },
        messages: [],
        tags: {}
      });
      deleteQueue({ QueueUrl });
      expect(getQueueState(QueueUrl)).toBeUndefined();
    });

    test('fail when queue is not found', () => {
      createQueue({ QueueName: 'foo-bar1' }, 'localhost:3000');

      let err1;
      try {
        deleteQueue({ QueueUrl: 'http://localhost:3000/queues/foo-bar2' });
      } catch (err) {
        err1 = err;
      }
      expect(err1.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });
  });

  describe('tagQueue', () => {
    afterEach(() => clearQueues());
    test('successfully tag queue', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      const Tags = { foo: 'bar' };
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      tagQueue(QueueUrl, Tags);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo: 'bar' });
    });

    test('tag queue with identical tag', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      const Tags = { foo: 'bar' };
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      tagQueue(QueueUrl, Tags);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo: 'bar' });
      tagQueue(QueueUrl, Tags);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo: 'bar' });
    });

    test('tag queue with multiple tags', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar-tags';
      const Tags1 = { foo1: 'bar1' };
      const Tags2 = { foo2: 'bar2' };
      createQueue({ QueueName: 'foo-bar-tags' }, 'localhost:3000');
      tagQueue(QueueUrl, Tags1);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo1: 'bar1' });
      tagQueue(QueueUrl, Tags2);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo1: 'bar1', foo2: 'bar2' });
    });
  });

  describe('listQueueTags', () => {
    afterEach(() => clearQueues());
    test('successfully list queue tags', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      const Tags = { baz: 'ban', foo: 'bar' };
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      tagQueue(QueueUrl, Tags);
      expect(listQueueTags(QueueUrl)).toEqual({ baz: 'ban', foo: 'bar' });
    });

    test('successfully list queue tags when there are no tags', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      expect(listQueueTags(QueueUrl)).toEqual({});
    });
  });

  describe('untagQueue', () => {
    afterEach(() => clearQueues());
    test('successfully untag queue', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      const Tags = { foo: 'bar' };
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      tagQueue(QueueUrl, Tags);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo: 'bar' });
      untagQueue(QueueUrl, ['foo']);
      expect(getQueueState(QueueUrl).tags).toEqual({});
    });

    test('try to untag queue, when tag does not exist', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      const Tags = { foo: 'bar' };
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      tagQueue(QueueUrl, Tags);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo: 'bar' });
      untagQueue(QueueUrl, ['foo1']);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo: 'bar' });
    });

    test('untag mutiple tags ', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar';
      const Tags = { foo1: 'bar1', foo2: 'bar2', foo3: 'bar3' };
      createQueue({ QueueName: 'foo-bar' }, 'localhost:3000');
      tagQueue(QueueUrl, Tags);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo1: 'bar1', foo2: 'bar2', foo3: 'bar3' });
      untagQueue(QueueUrl, ['foo1', 'foo3']);
      expect(getQueueState(QueueUrl).tags).toEqual({ foo2: 'bar2' });
    });
  });

  describe('setQueueAttributes', () => {
    afterEach(() => clearQueues());
    test('successfully set queue attributes', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar.fifo';
      const Attributes = {
        ContentBasedDeduplication: true,
        DelaySeconds: '11',
        FifoQueue: true,
        MaximumMessageSize: '111111',
        MessageRetentionPeriod: '21111',
        ReceiveMessageWaitTimeSeconds: '11',
        RedrivePolicy: {
          deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:foo-bar-dlq.fifo',
          maxReceiveCount: '1000'
        },
        VisibilityTimeout: '11'
      };
      createQueue({ Attributes: { FifoQueue: true }, QueueName: 'foo-bar-dlq.fifo' });
      createQueue({ Attributes: { FifoQueue: true }, QueueName: 'foo-bar.fifo' });
      expect(getQueueState(QueueUrl).Attributes).toEqual({
        ContentBasedDeduplication: false,
        CreatedTimestamp: expect.anything(),
        DelaySeconds: 0,
        FifoQueue: true,
        KmsDataKeyReusePeriodSeconds: 300,
        KmsMasterKeyId: 'alias/aws/sqs',
        MaximumMessageSize: 262144,
        MessageRetentionPeriod: 345600,
        QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar.fifo',
        ReceiveMessageWaitTimeSeconds: 0,
        RedrivePolicy: undefined,
        VisibilityTimeout: 30
      });
      setQueueAttributes(QueueUrl, Attributes);
      expect(getQueueState(QueueUrl).Attributes).toEqual({
        ContentBasedDeduplication: true,
        CreatedTimestamp: expect.anything(),
        DelaySeconds: '11',
        FifoQueue: true,
        KmsDataKeyReusePeriodSeconds: 300,
        KmsMasterKeyId: 'alias/aws/sqs',
        MaximumMessageSize: '111111',
        MessageRetentionPeriod: '21111',
        QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar.fifo',
        ReceiveMessageWaitTimeSeconds: '11',
        RedrivePolicy: {
          deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:foo-bar-dlq.fifo',
          maxReceiveCount: '1000'
        },
        VisibilityTimeout: '11'
      });
    });

    test('throw error when queue does not exist', () => {
      let err1;
      try {
        setQueueAttributes('http://localhost:3000/queues/foo-bar', { Attributes: {} });
      } catch (err) {
        err1 = err;
      }
      expect(err1.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });
  });

  describe('getQueueAttributes', () => {
    afterEach(() => clearQueues());
    test('throw error when queue does not exist', () => {
      let err1;
      try {
        getQueueAttributes('http://localhost:3000/queues/foo-bar', ['All']);
      } catch (err) {
        err1 = err;
      }
      expect(err1.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });

    test('return all attributes', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar.fifo';
      const Attributes = {
        ContentBasedDeduplication: true,
        DelaySeconds: '11',
        FifoQueue: true,
        MaximumMessageSize: '111111',
        MessageRetentionPeriod: '21111',
        ReceiveMessageWaitTimeSeconds: '11',
        RedrivePolicy: {
          deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:foo-bar-dlq.fifo',
          maxReceiveCount: '1000'
        },
        VisibilityTimeout: '11'
      };
      createQueue({ Attributes: { FifoQueue: true }, QueueName: 'foo-bar-dlq.fifo' });
      createQueue({ Attributes: { FifoQueue: true }, QueueName: 'foo-bar.fifo' });
      expect(getQueueState(QueueUrl).Attributes).toEqual({
        ContentBasedDeduplication: false,
        CreatedTimestamp: expect.anything(),
        DelaySeconds: 0,
        FifoQueue: true,
        KmsDataKeyReusePeriodSeconds: 300,
        KmsMasterKeyId: 'alias/aws/sqs',
        MaximumMessageSize: 262144,
        MessageRetentionPeriod: 345600,
        QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar.fifo',
        ReceiveMessageWaitTimeSeconds: 0,
        RedrivePolicy: undefined,
        VisibilityTimeout: 30
      });
      setQueueAttributes(QueueUrl, Attributes);
      expect(getQueueAttributes(QueueUrl, ['All'])).toEqual({
        ApproximateNumberOfMessages: 0,
        ContentBasedDeduplication: true,
        CreatedTimestamp: expect.anything(),
        DelaySeconds: '11',
        FifoQueue: true,
        KmsDataKeyReusePeriodSeconds: 300,
        KmsMasterKeyId: 'alias/aws/sqs',
        MaximumMessageSize: '111111',
        MessageRetentionPeriod: '21111',
        QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar.fifo',
        ReceiveMessageWaitTimeSeconds: '11',
        RedrivePolicy:
          '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:queues:foo-bar-dlq.fifo","maxReceiveCount":"1000"}',
        VisibilityTimeout: '11'
      });
    });

    test('return when none of attributes match', () => {
      const QueueUrl = 'http://localhost:3000/queues/foo-bar.fifo';
      const Attributes = {
        ContentBasedDeduplication: true,
        DelaySeconds: '11',
        FifoQueue: true,
        MaximumMessageSize: '111111',
        MessageRetentionPeriod: '21111',
        ReceiveMessageWaitTimeSeconds: '11',
        RedrivePolicy: {
          deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:foo-bar-dlq.fifo',
          maxReceiveCount: '1000'
        },
        VisibilityTimeout: '11'
      };
      createQueue({ Attributes: { FifoQueue: true }, QueueName: 'foo-bar-dlq.fifo' });
      createQueue({ Attributes: { FifoQueue: true }, QueueName: 'foo-bar.fifo' });
      expect(getQueueState(QueueUrl).Attributes).toEqual({
        ContentBasedDeduplication: false,
        CreatedTimestamp: expect.anything(),
        DelaySeconds: 0,
        FifoQueue: true,
        KmsDataKeyReusePeriodSeconds: 300,
        KmsMasterKeyId: 'alias/aws/sqs',
        MaximumMessageSize: 262144,
        MessageRetentionPeriod: 345600,
        QueueArn: 'arn:aws:sqs:us-east-1:queues:foo-bar.fifo',
        ReceiveMessageWaitTimeSeconds: 0,
        RedrivePolicy: undefined,
        VisibilityTimeout: 30
      });
      setQueueAttributes(QueueUrl, Attributes);
      expect(getQueueAttributes(QueueUrl, [])).toEqual({});
    });
  });

  describe('getQueueUrl', () => {
    afterEach(() => clearQueues());
    test('successfully get queue name', () => {
      createQueue({ QueueName: 'core-test' }, 'localhost:3001');
      expect(getQueueUrl('core-test', 'localhost:3001')).toEqual(
        'http://localhost:3001/queues/core-test'
      );
    });

    test('throw error when queue does not exist', () => {
      let err1;
      try {
        getQueueUrl('core-test', 'localhost:3001');
      } catch (err) {
        err1 = err;
      }
      expect(err1.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });
  });

  describe('purgeQueue', () => {
    afterEach(() => clearQueues());
    test('successfully purge queue', () => {
      const QueueUrl = 'http://localhost:3001/queues/core-test';
      createQueue({ QueueName: 'core-test' });
      sendMessage({ MessageBody: 'foo1', QueueUrl });
      expect(getQueueState(QueueUrl).messages.length).toEqual(1);
      purgeQueue('http://localhost:3001/queues/core-test');
      expect(getQueueState(QueueUrl).messages.length).toEqual(0);
    });

    test('throw error when queue is not found', () => {
      let err1;
      try {
        purgeQueue('http://localhost:3001/queues/core-test');
      } catch (err) {
        err1 = err;
      }
      expect(err1.message).toEqual('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });
  });

  describe('listDeadLetterSourceQueues', () => {
    afterEach(() => clearQueues());

    test('return all queues that use provided dead letter queue', () => {
      const QueueUrlDlq = 'http://localhost:3001/queues/core-test-dlq';
      const QueueUrl1 = 'http://localhost:3001/queues/core-test-1';
      const QueueUrl2 = 'http://localhost:3001/queues/core-test-2';
      createQueue({ QueueName: 'core-test-dlq' });
      createQueue({ QueueName: 'core-test-1' });
      createQueue({ QueueName: 'core-test-2' });
      const Attributes = {
        FifoQueue: false, // This might be problem
        RedrivePolicy: {
          deadLetterTargetArn: 'arn:aws:sqs:us-east-1:queues:core-test-dlq',
          maxReceiveCount: '1000'
        }
      };
      setQueueAttributes(QueueUrl1, Attributes);
      setQueueAttributes(QueueUrl2, Attributes);

      expect(listDeadLetterSourceQueues(QueueUrlDlq, 'http://localhost:3001')).toEqual([
        'http://http://localhost:3001/queues/core-test-1',
        'http://http://localhost:3001/queues/core-test-2'
      ]);
    });
    test('throw error when queue does not exist', () => {
      let err1;
      try {
        listDeadLetterSourceQueues(
          'http://localhost:3001/queues/core-test-dlq',
          'http://localhost:3001'
        );
      } catch (err) {
        err1 = err;
      }
      expect(err1.message).toEqual('The specified queue does not exist for this wsdl version.');
    });
  });

  describe('changeMessageVisibility', () => {
    afterEach(() => clearQueues());
    test('throw error when queue does not exist', () => {
      let err1;
      try {
        changeMessageVisibility({
          QueueUrl: 'http://localhost:3000/queues/core-test',
          ReceiptHandle: '10001',
          VisibilityTimeout: 501
        });
      } catch (err) {
        err1 = err;
      }
      expect(err1.message).toEqual('The specified queue does not exist for this wsdl version.');
    });

    test('successfully update visibility timeout', () => {
      createQueue(
        {
          Attributes: { VisibilityTimeout: 200 },
          QueueName: 'core-test'
        },
        'localhost:3000'
      );
      sendMessage({
        MessageBody: 'foo1',
        QueueUrl: 'http://localhost:3000/queues/core-test'
      });

      const receivedMessage = receiveMessage({
        QueueUrl: 'http://localhost:3000/queues/core-test',
        VisibilityTimeout: 500
      });

      expect(
        getQueueState('http://localhost:3000/queues/core-test').messages[0]['@State']
          .VisibilityTimeout
      ).toBe(500);

      changeMessageVisibility({
        QueueUrl: 'http://localhost:3000/queues/core-test',
        ReceiptHandle: receivedMessage[0].ReceiptHandle,
        VisibilityTimeout: 501
      });
      expect(
        getQueueState('http://localhost:3000/queues/core-test').messages[0]['@State']
          .VisibilityTimeout
      ).toBe(501);
    });

    test('throw error when VisibilityTimeout is out of range', () => {
      createQueue(
        {
          Attributes: { VisibilityTimeout: 200 },
          QueueName: 'core-test'
        },
        'localhost:3000'
      );
      sendMessage({
        MessageBody: 'foo1',
        QueueUrl: 'http://localhost:3000/queues/core-test'
      });

      const receivedMessage = receiveMessage({
        QueueUrl: 'http://localhost:3000/queues/core-test',
        VisibilityTimeout: 500
      });

      const errors = [];
      try {
        changeMessageVisibility({
          QueueUrl: 'http://localhost:3000/queues/core-test',
          ReceiptHandle: receivedMessage[0].ReceiptHandle,
          VisibilityTimeout: -1
        });
      } catch (err) {
        errors.push(err);
      }

      try {
        changeMessageVisibility({
          QueueUrl: 'http://localhost:3000/queues/core-test',
          ReceiptHandle: receivedMessage[0].ReceiptHandle,
          VisibilityTimeout: 43201
        });
      } catch (err) {
        errors.push(err);
      }

      expect(errors[0].code).toEqual('ClientError');
      expect(errors[0].message).toEqual(
        'An error occurred (InvalidParameterValue) when calling the ChangeMessageVisibility operation: Value -1 for parameter VisibilityTimeout is invalid. Reason: VisibilityTimeout must be an integer between 0 and 43200'
      );
      expect(errors[1].code).toEqual('ClientError');
      expect(errors[1].message).toEqual(
        'An error occurred (InvalidParameterValue) when calling the ChangeMessageVisibility operation: Value 43201 for parameter VisibilityTimeout is invalid. Reason: VisibilityTimeout must be an integer between 0 and 43200'
      );
    });

    test('skip update visibility timeout when receiptHandle does not exist', () => {
      createQueue(
        {
          Attributes: { VisibilityTimeout: 200 },
          QueueName: 'core-test'
        },
        'localhost:3000'
      );
      sendMessage({
        MessageBody: 'foo1',
        QueueUrl: 'http://localhost:3000/queues/core-test'
      });

      receiveMessage({
        QueueUrl: 'http://localhost:3000/queues/core-test',
        VisibilityTimeout: 500
      });

      expect(
        getQueueState('http://localhost:3000/queues/core-test').messages[0]['@State']
          .VisibilityTimeout
      ).toBe(500);

      changeMessageVisibility({
        QueueUrl: 'http://localhost:3000/queues/core-test',
        ReceiptHandle: '100001',
        VisibilityTimeout: 501
      });
      expect(
        getQueueState('http://localhost:3000/queues/core-test').messages[0]['@State']
          .VisibilityTimeout
      ).toBe(500);
    });
  });
});
