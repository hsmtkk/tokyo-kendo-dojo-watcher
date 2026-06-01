import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
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
        WEBSITE_URL: "https://www.todoren.com/",
      },
      handler: "index.handler",
      loggingFormat: lambda.LoggingFormat.JSON,
      runtime: lambda.Runtime.PYTHON_3_14,
      timeout: cdk.Duration.seconds(10),
    });

    const schedule = new scheduler.Schedule(this, "Schedule", {
      schedule: scheduler.ScheduleExpression.rate(cdk.Duration.hours(1)),
      target: new scheduler_targets.LambdaInvoke(func),
    });

    bucket.grantReadWrite(func);
    topic.grantPublish(func);

    const alarm = new cloudwatch.Alarm(this, "Alarm", {
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      datapointsToAlarm: 3,
      evaluationPeriods: 3,
      metric: func.metricErrors({
        period: cdk.Duration.hours(1),
        statistic: "Sum",
      }),
      threshold: 0,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    alarm.addAlarmAction(new cloudwatch_actions.SnsAction(topic));
    alarm.addOkAction(new cloudwatch_actions.SnsAction(topic));
  }
}
