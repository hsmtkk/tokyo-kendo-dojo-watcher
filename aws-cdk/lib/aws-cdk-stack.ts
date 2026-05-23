import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as scheduler_targets from 'aws-cdk-lib/aws-scheduler-targets';
import * as sns from 'aws-cdk-lib/aws-sns';

export class TokyoKendoDojoWatcherStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "Bucket", {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    bucket.addLifecycleRule({
      expiration: cdk.Duration.days(7),
    });

    const topic = new sns.Topic(this, "Topic");
    // subscription should be add manually.

    const func = new lambda.Function(this, "Function", {
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        LOG_LEVEL: "INFO",
        TOPIC_ARN: topic.topicArn,
        WEBSITE_URL: "https://www.kantei.go.jp/jp/news/index.html",
      },
      handler: "index.handler",
      loggingFormat: lambda.LoggingFormat.JSON,
      runtime: lambda.Runtime.PYTHON_3_14,
    });

    const schedule = new scheduler.Schedule(this, "Schedule", {
      schedule: scheduler.ScheduleExpression.rate(cdk.Duration.minutes(5)),
      target: new scheduler_targets.LambdaInvoke(func),
    });

    bucket.grantReadWrite(func);
    topic.grantPublish(func);
  }
}
