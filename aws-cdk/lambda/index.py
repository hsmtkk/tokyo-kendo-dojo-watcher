import datetime
import hashlib
import logging
import os
import urllib.request

import boto3

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))


def handler(event, context):
    prev_key = get_previous_content_key()
    prev_content = get_content(prev_key)

    content = get_web_content()
    put_content(content)

    previous_hash = calculate_hash(prev_content)
    current_hash = calculate_hash(content)
    logger.info("previous hash", extra={"hash": previous_hash})
    logger.info("current hash", extra={"hash": current_hash})

    if prev_content != content:
        logger.info("web site has changed")
        notify(previous_hash, current_hash)
    else:
        logger.info("web site has NOT changed")
    return {"statusCode": 200, "body": "ok"}


def get_web_content() -> bytes:
    logger.debug("get_web_content begin")
    website_url = os.environ["WEBSITE_URL"]
    with urllib.request.urlopen(website_url) as response:
        content = response.read()
    logger.debug("get_web_content end")
    return content


def put_content(content: bytes):
    logger.debug("put_content begin")
    key = datetime.datetime.now().strftime("%Y%m%d%H%M") + ".html"
    s3_client = boto3.client("s3")
    s3_client.put_object(Bucket=os.environ["BUCKET_NAME"], Key=key, Body=content)
    logger.debug("put_content end")


def get_previous_content_key() -> str:
    logger.debug("get_previous_content_key begin")
    s3_client = boto3.client("s3")
    resp = s3_client.list_objects_v2(Bucket=os.environ["BUCKET_NAME"])
    keys = []
    for content in resp["Contents"]:
        keys.append(content["Key"])
    latest_key = sorted(keys)[-1]
    logger.debug("get_previous_content_key end")
    return latest_key


def get_content(key: str) -> bytes:
    logger.debug("get_content begin")
    s3_client = boto3.client("s3")
    resp = s3_client.get_object(Bucket=os.environ["BUCKET_NAME"], Key=key)
    content = resp["Body"].read()
    logger.debug("get_content end")
    return content


def calculate_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def notify(previous_hash: str, current_hash: str):
    logger.debug("notify begin")
    sns_client = boto3.client("sns")
    sns_client.publish(
        TopicArn=os.environ["TOPIC_ARN"],
        Subject="web site has changed",
        Message=f"previous hash: {previous_hash}\ncurrent hash: {current_hash}",
    )
    logger.debug("notify end")
