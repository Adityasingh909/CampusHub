
require("dotenv").config();

const { ListObjectsV2Command } = require("@aws-sdk/client-s3");
const r2 = require("./config/r2");

async function testR2() {
  try {
    const result = await r2.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        MaxKeys: 5,
      })
    );

    console.log("R2 connection successful!");
    console.log("Objects found:", result.KeyCount);
  } catch (error) {
    console.error("R2 connection failed:", error.message);
  }
}

testR2();
