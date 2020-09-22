'use strict';

const { SQS } = require('aws-sdk');
const index = require('.');

describe('lib/index', () => {
  const port = Math.round(Math.random() * 5000 + 1000);
  const endpoint = `http://localhost:${port}`;
  let sqsLiteServer;
  let client;

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      sqsLiteServer = index({ logger: false });
      sqsLiteServer.listen(port, (err) => {
        if (err) reject(err);
        else {
          try {
            client = new SQS({
              accessKeyId: 'foo',
              endpoint,
              region: 'us-east-1',
              secretAccessKey: 'bar'
            });
            resolve();
          } catch (err_) {
            reject(err_);
          }
        }
      });
    });
  });

  describe('listQueues', () => {
    test('list queues', async () => {
      await expect(client.listQueues({}).promise()).resolves.toEqual({
        ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
      });
    });
  });

  describe('createQueue', () => {
    describe('QueueName', () => {
      test('throw an error when queue name is too long', async () => {
        await expect(
          client
            .createQueue({
              QueueName:
                '123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789-1'
            })
            .promise()
        ).rejects.toThrow(
          'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
        );
      });

      test('throw an error when queue name has invalid characters', async () => {
        await expect(client.createQueue({ QueueName: 'abc@' }).promise()).rejects.toThrow(
          'Can only include alphanumeric characters, hyphens, or underscores. 1 to 80 in length'
        );
      });

      test('successfully create queue', async () => {
        await expect(client.createQueue({ QueueName: 'foo-bar' }).promise()).resolves.toEqual({
          QueueUrl: `http://localhost:${port}/queues/foo-bar`,
          ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
        });
      });
    });

    describe('Attributes', () => {
      describe('DelaySeconds', () => {
        test('throw error when DelaySeconds is larger than allowed', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { DelaySeconds: '901' },
                QueueName: 'foo-bar-delaySeconds'
              })
              .promise()
          ).rejects.toThrow('Invalid value for the parameter DelaySeconds.');
        });

        test('throw error when DelaySeconds is lower than allowed', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { DelaySeconds: '-1' },
                QueueName: 'foo-bar-delaySeconds'
              })
              .promise()
          ).rejects.toThrow('Invalid value for the parameter DelaySeconds.');
        });

        test('create queue with DelaySeconds attribute', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { DelaySeconds: '10' },
                QueueName: 'foo-bar-delaySeconds'
              })
              .promise()
          ).resolves.toEqual({
            QueueUrl: `http://localhost:${port}/queues/foo-bar-delaySeconds`,
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('MaximumMessageSize', () => {
        test('throw error when MaximumMessageSize is larger than allowed value', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { MaximumMessageSize: '262145' },
                QueueName: 'foo-bar-maximumMessageSize'
              })
              .promise()
          ).rejects.toThrow('Invalid value for the parameter MaximumMessageSize.');
        });

        test('throw error when MaximumMessageSize is lower than allowed value', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { MaximumMessageSize: '1023' },
                QueueName: 'foo-bar-maximumMessageSize'
              })
              .promise()
          ).rejects.toThrow('Invalid value for the parameter MaximumMessageSize.');
        });

        test('create queue with MaximumMessageSize', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { MaximumMessageSize: '1024' },
                QueueName: 'foo-bar-maximumMessageSize'
              })
              .promise()
          ).resolves.toEqual({
            QueueUrl: `http://localhost:${port}/queues/foo-bar-maximumMessageSize`,
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('MessageRetentionPeriod', () => {
        /**
         * aws sqs create-queue --queue-name=foo-bar-messageRetentionPeriod --attributes MessageRetentionPeriod=1209601 --region=us-east-1 --debug
         */
        test('throw an error when MessageRetentionPeriod larger than allowed', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { MessageRetentionPeriod: '1209601' },
                QueueName: 'foo-bar-messageRetentionPeriod'
              })
              .promise()
          ).rejects.toThrow('Invalid value for the parameter MessageRetentionPeriod.');
        });

        test('throw an error when MessageRetentionPeriod lower than allowed', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { MessageRetentionPeriod: '59' },
                QueueName: 'foo-bar-messageRetentionPeriod'
              })
              .promise()
          ).rejects.toThrow('Invalid value for the parameter MessageRetentionPeriod.');
        });

        test('create queue with MessageRetentionPeriodattribute', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { MessageRetentionPeriod: '60' },
                QueueName: 'foo-bar-messageRetentionPeriod'
              })
              .promise()
          ).resolves.toEqual({
            QueueUrl: `http://localhost:${port}/queues/foo-bar-messageRetentionPeriod`,
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('ReceiveMessageWaitTimeSeconds', () => {
        /**
         * aws sqs create-queue --queue-name=foo-bar-receiveMessageWaitTimeSeconds --attributes ReceiveMessageWaitTimeSeconds=21 --region=us-east-1 --debug
         */
        test('throw an error when ReceiveMessageWaitTimeSeconds is larger value than allowed', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { ReceiveMessageWaitTimeSeconds: '21' },
                QueueName: 'foo-bar-receiveMessageWaitTimeSeconds'
              })
              .promise()
          ).rejects.toThrow('Invalid value for the parameter ReceiveMessageWaitTimeSeconds.');
        });

        test('throw an error when ReceiveMessageWaitTimeSeconds is lower value than allowed', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { ReceiveMessageWaitTimeSeconds: '-1' },
                QueueName: 'foo-bar-receiveMessageWaitTimeSeconds'
              })
              .promise()
          ).rejects.toThrow('Invalid value for the parameter ReceiveMessageWaitTimeSeconds.');
        });

        test('create queue with ReceiveMessageWaitTimeSeconds', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { ReceiveMessageWaitTimeSeconds: '0' },
                QueueName: 'foo-bar-receiveMessageWaitTimeSeconds'
              })
              .promise()
          ).resolves.toEqual({
            QueueUrl: `http://localhost:${port}/queues/foo-bar-receiveMessageWaitTimeSeconds`,
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('RedrivePolicy', () => {
        test('throw an error when RedrivePolicy missing deadLetterTargetArn', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { RedrivePolicy: '{"maxReceiveCount":"1000"}' },
                QueueName: 'foo-bar'
              })
              .promise()
          ).rejects.toThrow(
            'Value {&quot;maxReceiveCount&quot;:&quot;1000&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: deadLetterTargetArn.'
          );
        });

        test('throw an error when RedrivePolicy missing maxReceiveCount', async () => {
          await expect(
            client
              .createQueue({
                Attributes: {
                  RedrivePolicy:
                    '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue"}'
                },
                QueueName: 'foo-bar'
              })
              .promise()
          ).rejects.toThrow(
            'Value {&quot;deadLetterTargetArn&quot;:&quot;arn:aws:sqs:us-east-1:80398EXAMPLE:MyDeadLetterQueue&quot;} for parameter RedrivePolicy is invalid. Reason: Redrive policy does not contain mandatory attribute: maxReceiveCount.'
          );
        });

        test('throw error when creating queue with same name but different deadLetterTargetArn', async () => {
          await client.createQueue({ QueueName: 'dead-letter-queue1' }).promise();
          await client.createQueue({ QueueName: 'dead-letter-queue2' }).promise();
          await client
            .createQueue({
              Attributes: {
                RedrivePolicy:
                  '{"deadLetterTargetArn": "arn:aws:sqs:us-east-1:queues:dead-letter-queue1","maxReceiveCount": "10"}'
              },
              QueueName: 'foo-bar-123'
            })
            .promise();
          await expect(
            client
              .createQueue({
                Attributes: {
                  RedrivePolicy:
                    '{"deadLetterTargetArn": "arn:aws:sqs:us-east-1:queues:dead-letter-queue2","maxReceiveCount": "10"}'
                },
                QueueName: 'foo-bar-123'
              })
              .promise()
          ).rejects.toThrow(
            'A queue already exists with the same name and a different value for attribute RedrivePolicy'
          );
        });

        test('throw error when creating queue with same name but different maxReceiveCount', async () => {
          await client.createQueue({ QueueName: 'dead-letter-queue1' }).promise();
          await client
            .createQueue({
              Attributes: {
                RedrivePolicy:
                  '{"deadLetterTargetArn": "arn:aws:sqs:us-east-1:queues:dead-letter-queue1","maxReceiveCount": "5"}'
              },
              QueueName: 'foo-bar-456'
            })
            .promise();
          await expect(
            client
              .createQueue({
                Attributes: {
                  RedrivePolicy:
                    '{"deadLetterTargetArn": "arn:aws:sqs:us-east-1:queues:dead-letter-queue1","maxReceiveCount": "10"}'
                },
                QueueName: 'foo-bar-456'
              })
              .promise()
          ).rejects.toThrow(
            'A queue already exists with the same name and a different value for attribute RedrivePolicy'
          );
        });

        test('create queue with Redrive Policy', async () => {
          await client.createQueue({ QueueName: 'foo-bar-dlq' }).promise();
          await expect(
            client
              .createQueue({
                Attributes: {
                  RedrivePolicy:
                    '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:queues:foo-bar-dlq","maxReceiveCount":10}'
                },
                QueueName: 'foo-bar'
              })
              .promise()
          ).resolves.toEqual({
            QueueUrl: `http://localhost:${port}/queues/foo-bar`,
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('VisibilityTimeout', () => {
        test('throw an error when VisibilityTimeout is larger value than allowed', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { VisibilityTimeout: '43201' },
                QueueName: 'foo-bar-visibilityTimeout'
              })
              .promise()
          ).rejects.toThrow('Invalid value for the parameter VisibilityTimeout.');
        });

        test('throw an error when VisibilityTimeout is lower value than allowed', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { VisibilityTimeout: '-1' },
                QueueName: 'foo-bar-visibilityTimeout'
              })
              .promise()
          ).rejects.toThrow('Invalid value for the parameter VisibilityTimeout.');
        });

        test('create queue with VisibilityTimeout attribute', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { VisibilityTimeout: '30' },
                QueueName: 'foo-bar-visibilityTimeout'
              })
              .promise()
          ).resolves.toEqual({
            QueueUrl: `http://localhost:${port}/queues/foo-bar-visibilityTimeout`,
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('KmsMasterKeyId', () => {
        /**
         * AWS seems to not verify value for KmsMasterKeyId
         */
        test('create queue with KmsMasterKeyId attribute', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { KmsMasterKeyId: 'foo' },
                QueueName: 'foo-bar-kmsMasterKeyId'
              })
              .promise()
          ).resolves.toEqual({
            QueueUrl: `http://localhost:${port}/queues/foo-bar-kmsMasterKeyId`,
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('KmsDataKeyReusePeriodSeconds', () => {
        test('throw error when KmsDataKeyReusePeriodSeconds value is larger than allowed', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { KmsDataKeyReusePeriodSeconds: '86401' },
                QueueName: 'foo-bar-kmsDataKeyReusePeriodSeconds'
              })
              .promise()
          ).rejects.toThrow('Invalid value for the parameter KmsDataKeyReusePeriodSeconds.');
        });

        test('throw error when KmsDataKeyReusePeriodSeconds value is lower than allowed', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { KmsDataKeyReusePeriodSeconds: '59' },
                QueueName: 'foo-bar-kmsDataKeyReusePeriodSeconds'
              })
              .promise()
          ).rejects.toThrow('Invalid value for the parameter KmsDataKeyReusePeriodSeconds.');
        });

        test('create queue with KmsDataKeyReusePeriodSeconds attribute', async () => {
          await expect(
            client
              .createQueue({
                Attributes: { KmsDataKeyReusePeriodSeconds: '60' },
                QueueName: 'foo-bar-kmsDataKeyReusePeriodSeconds'
              })
              .promise()
          ).resolves.toEqual({
            QueueUrl: `http://localhost:${port}/queues/foo-bar-kmsDataKeyReusePeriodSeconds`,
            ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
          });
        });
      });

      describe('FifoQueue', () => {
        test('throw an error when attempting to create fifo queue with no .fifo postfix', async () => {
          await expect(
            client
              .createQueue({ Attributes: { FifoQueue: 'true' }, QueueName: 'foo-bar' })
              .promise()
          ).rejects.toThrow(
            'The name of a FIFO queue can only include alphanumeric characters, hyphens, or underscores, must end with .fifo suffix and be 1 to 80 in length.'
          );
        });
      });

      describe('Attribute Errors', () => {
        test('QueueAlreadyExists when trying to create duplicate queue with different params', async () => {
          await client
            .createQueue({ Attributes: { DelaySeconds: '100' }, QueueName: 'test-duplicate' })
            .promise();
          await expect(
            client
              .createQueue({
                Attributes: { DelaySeconds: '100', VisibilityTimeout: '500' },
                QueueName: 'test-duplicate'
              })
              .promise()
          ).rejects.toThrow(
            'A queue already exists with the same name and a different value for attribute VisibilityTimeout'
          );
        });
      });
    });

    describe('Tags', () => {
      test('successfully create queue with tags', async () => {
        await expect(
          client
            .createQueue({ QueueName: 'foo-bar-with-tags', tags: { foo: 'bar', foo1: 'bar1' } })
            .promise()
        ).resolves.toEqual({
          QueueUrl: `http://localhost:${port}/queues/foo-bar-with-tags`,
          ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
        });
      });
    });

    test('throw error when attempting to set ContentBasedDeduplication, with a non FIFO queue', async () => {
      await expect(
        client
          .createQueue({ Attributes: { ContentBasedDeduplication: 'true' }, QueueName: 'foo-bar' })
          .promise()
      ).rejects.toThrow('Unknown Attribute ContentBasedDeduplication.');
    });
  });

  describe('sendMessage', () => {
    test('successfully send message', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await expect(
        client
          .sendMessage({
            MessageBody: 'foo',
            QueueUrl: `${endpoint}/queues/core-test`
          })
          .promise()
      ).resolves.toEqual({
        MD5OfMessageBody: expect.any(String),
        MessageId: expect.any(String),
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });

    test('throw error when queue does not exist', async () => {
      await expect(
        client
          .sendMessage({
            MessageBody: 'some message',
            QueueUrl: `${endpoint}/queues/foo-bar123`
          })
          .promise()
      ).rejects.toThrow('AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.');
    });
  });

  describe('sendMessageBatch', () => {
    test('successfully send batch of messages, with no message attributes', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await expect(
        client
          .sendMessageBatch({
            Entries: [
              { Id: '1', MessageBody: 'mb1' },
              { Id: '2', MessageBody: 'mb2' }
            ],
            QueueUrl: `${endpoint}/queues/core-test`
          })
          .promise()
      ).resolves.toEqual({
        Failed: [],
        ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' },
        Successful: [
          { Id: 'c4ca4238a0b923820dcc509a6f75849b', MessageId: expect.any(String) },
          { Id: 'c81e728d9d4c2f636f067f89cc14862c', MessageId: expect.any(String) }
        ]
      });
    });
  });

  describe('receiveMessage', () => {
    test('successfully receive message', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .sendMessage({ MessageBody: 'foo', QueueUrl: `${endpoint}/queues/core-test` })
        .promise();
      await expect(
        client.receiveMessage({ QueueUrl: `${endpoint}/queues/core-test` }).promise()
      ).resolves.toEqual({
        Messages: [
          {
            Body: 'foo',
            MD5OfBody: 'acbd18db4cc2f85cedef654fccc4a4d8',
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ],
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });

    test('successfully receive multiple messages', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .sendMessage({ MessageBody: 'foo1', QueueUrl: `${endpoint}/queues/core-test` })
        .promise();
      await client
        .sendMessage({ MessageBody: 'foo2', QueueUrl: `${endpoint}/queues/core-test` })
        .promise();
      await client
        .sendMessage({ MessageBody: 'foo3', QueueUrl: `${endpoint}/queues/core-test` })
        .promise();

      await expect(
        client
          .receiveMessage({ MaxNumberOfMessages: 3, QueueUrl: `${endpoint}/queues/core-test` })
          .promise()
      ).resolves.toMatchObject({
        Messages: [
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
        ],
        ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
      });
    });

    test('successfully receive multiple messages when there are less messages than requested', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .sendMessage({ MessageBody: 'foo1', QueueUrl: `${endpoint}/queues/core-test` })
        .promise();
      await expect(
        client
          .receiveMessage({ MaxNumberOfMessages: 3, QueueUrl: `${endpoint}/queues/core-test` })
          .promise()
      ).resolves.toEqual({
        Messages: [
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ],
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });

    test('return no messages when there are no messages to return', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await expect(
        client
          .receiveMessage({ MaxNumberOfMessages: 1, QueueUrl: `${endpoint}/queues/core-test` })
          .promise()
      ).resolves.toEqual({
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });

    test('receive messages with message attribute All', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .sendMessage({
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
          QueueUrl: `${endpoint}/queues/core-test`
        })
        .promise();
      await expect(
        client
          .receiveMessage({
            MaxNumberOfMessages: 1,
            MessageAttributeNames: ['All'],
            QueueUrl: `${endpoint}/queues/core-test`
          })
          .promise()
      ).resolves.toMatchObject({
        Messages: [
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MessageAttributes: {
              City: {
                BinaryListValues: [],
                DataType: 'String',
                StringListValues: [],
                StringValue: 'Any City'
              },
              Greeting: {
                BinaryListValues: [],
                BinaryValue: {
                  0: 72,
                  1: 101,
                  2: 108,
                  3: 108,
                  4: 111,
                  5: 44,
                  6: 32,
                  7: 87,
                  8: 111,
                  9: 114,
                  10: 108,
                  11: 100,
                  12: 33
                },
                DataType: 'Binary',
                StringListValues: []
              },
              Population: {
                BinaryListValues: [],
                DataType: 'Number',
                StringListValues: [],
                StringValue: '1250800'
              }
            },
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ],
        ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
      });
    });

    test('receive message with specific attribute', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .sendMessage({
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
          QueueUrl: `${endpoint}/queues/core-test`
        })
        .promise();
      await expect(
        client
          .receiveMessage({
            MaxNumberOfMessages: 1,
            MessageAttributeNames: ['Population'],
            QueueUrl: `${endpoint}/queues/core-test`
          })
          .promise()
      ).resolves.toMatchObject({
        Messages: [
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MD5OfMessageAttributes: '13e03873859867aeade5b25ed6b00278',
            MessageAttributes: {
              Population: {
                BinaryListValues: [],
                DataType: 'Number',
                StringListValues: [],
                StringValue: '1250800'
              }
            },
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ],
        ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
      });
    });

    test('receive messages with multiple specific attributes', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .sendMessage({
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
          QueueUrl: `${endpoint}/queues/core-test`
        })
        .promise();
      await expect(
        client
          .receiveMessage({
            MaxNumberOfMessages: 1,
            MessageAttributeNames: ['Population', 'City'],
            QueueUrl: `${endpoint}/queues/core-test`
          })
          .promise()
      ).resolves.toMatchObject({
        Messages: [
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MD5OfMessageAttributes: '1364ec47767b4a8e2f5a6902227c25af',
            MessageAttributes: {
              City: {
                BinaryListValues: [],
                DataType: 'String',
                StringListValues: [],
                StringValue: 'Any City'
              },
              Population: {
                BinaryListValues: [],
                DataType: 'Number',
                StringListValues: [],
                StringValue: '1250800'
              }
            },
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ],
        ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
      });
    });

    test('receive messages with multiple specific attributes excluding non existent', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .sendMessage({
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
          QueueUrl: `${endpoint}/queues/core-test`
        })
        .promise();
      await expect(
        client
          .receiveMessage({
            MaxNumberOfMessages: 1,
            MessageAttributeNames: ['Population', 'Foo', 'City'],
            QueueUrl: `${endpoint}/queues/core-test`
          })
          .promise()
      ).resolves.toMatchObject({
        Messages: [
          {
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MD5OfMessageAttributes: 'ee165550f65c6a28fa8a29201ec4154c',
            MessageAttributes: {
              City: {
                BinaryListValues: [],
                DataType: 'String',
                StringListValues: [],
                StringValue: 'Any City'
              },
              Population: {
                BinaryListValues: [],
                DataType: 'Number',
                StringListValues: [],
                StringValue: '1250800'
              }
            },
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ],
        ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
      });
    });

    test('receive messages with multiple attributes', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .sendMessage({
          MessageBody: 'foo1',
          QueueUrl: `${endpoint}/queues/core-test`
        })
        .promise();
      await expect(
        client
          .receiveMessage({
            AttributeNames: ['All'],
            MaxNumberOfMessages: 1,
            QueueUrl: `${endpoint}/queues/core-test`
          })
          .promise()
      ).resolves.toMatchObject({
        Messages: [
          {
            Attributes: {
              ApproximateFirstReceiveTimestamp: expect.anything(),
              ApproximateReceiveCount: '1',
              SenderId: 'AAAAAAAAAAAAAAAAAAAAA:i-00a0aaa0aaa000000',
              SentTimestamp: expect.anything()
            },
            Body: 'foo1',
            MD5OfBody: '299a0be4a5a79e6a59fdd251b19d78bb',
            MessageId: expect.any(String),
            ReceiptHandle: expect.any(String)
          }
        ],
        ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' }
      });
    });
  });

  describe('deleteMessage', () => {
    test('successfully delete message', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .sendMessage({ MessageBody: 'foo', QueueUrl: `${endpoint}/queues/core-test` })
        .promise();
      const { Messages } = await client
        .receiveMessage({ QueueUrl: `${endpoint}/queues/core-test` })
        .promise();

      await expect(
        client
          .deleteMessage({
            QueueUrl: `${endpoint}/queues/core-test`,
            ReceiptHandle: Messages[0].ReceiptHandle
          })
          .promise()
      ).resolves.toEqual({
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });
  });

  describe('deleteQueue', () => {
    test('successfully delete queue', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await expect(
        client.deleteQueue({ QueueUrl: `${endpoint}/queues/core-test` }).promise()
      ).resolves.toEqual({
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });
  });

  describe('tagQueue', () => {
    test('successfully tag queue', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await expect(
        client
          .tagQueue({
            QueueUrl: `${endpoint}/queues/core-test`,
            Tags: { foo: 'bar' }
          })
          .promise()
      ).resolves.toEqual({
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });
  });

  describe('listQueueTags', () => {
    test('list tags when no tags exist', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await expect(
        client.listQueueTags({ QueueUrl: `${endpoint}/queues/core-test` }).promise()
      ).resolves.toEqual({
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });

    test('list tags', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await client
        .tagQueue({
          QueueUrl: `${endpoint}/queues/core-test`,
          Tags: { baz: 'ban', foo: 'bar' }
        })
        .promise();
      await expect(
        client.listQueueTags({ QueueUrl: `${endpoint}/queues/core-test` }).promise()
      ).resolves.toEqual({
        ResponseMetadata: { RequestId: '00000000-0000-0000-0000-000000000000' },
        Tags: { baz: 'ban', foo: 'bar' }
      });
    });
  });

  describe('untagQueue', () => {
    test('successfully untag queue', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await expect(
        client
          .untagQueue({
            QueueUrl: `${endpoint}/queues/core-test`,
            TagKeys: ['foo']
          })
          .promise()
      ).resolves.toEqual({
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });
  });

  describe('getQueueUrl', () => {
    test('successfully get queue url', async () => {
      await client.createQueue({ QueueName: 'core-test' }).promise();
      await expect(client.getQueueUrl({ QueueName: 'core-test' }).promise()).resolves.toEqual({
        QueueUrl: `http://localhost:${port}/queues/core-test`,
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        }
      });
    });

    test('throw error when queue does not exist', async () => {
      await expect(client.getQueueUrl({ QueueName: 'core-test123' }).promise()).rejects.toThrow(
        'AWS.SimpleQueueService.NonExistentQueue; see the SQS docs.'
      );
    });
  });

  describe('Default Option', () => {
    test('result to default option when Action is not implemented', () => {
      expect.assertions(1);
      const http = require('http');
      const body = 'Action=foo';

      return new Promise((resolve) => {
        const req = http.request(
          {
            headers: {
              'Content-Length': body.length,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'POST',
            path: '/',
            port
          },
          (res) => {
            res.on('data', (chunk) => {
              expect(chunk.toString('utf8')).toEqual('Action: foo is not implemented');
            });
            res.on('end', () => {
              resolve();
            });
          }
        );
        req.write(body);
        req.end();
      });
    });
  });

  afterAll(() => {
    sqsLiteServer.close();
  });
});
