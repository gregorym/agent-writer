const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: "https://s3.filebase.com",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});
const S3_BUCKET_NAME = "bloggy";

export async function uploadFileToS3(
  filePath: string,
  fileName: string
): Promise<string> {
  const putCommand = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    Body: videoBuffer, // Pass the downloaded buffer
    ContentType: "video/mp4",
  });
  await s3Client.send(putCommand);
  const cid = await getCID(s3Key);
  return `https://ipfs.io/ipfs/${cid}`;
}

export default async function getCID(s3Key: string) {
  const ipfsData = await fetch(
    `https://api.filebase.io/v1/ipfs/pins?name=${s3Key}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FILEBASE_PIN_API_KEY}`,
      },
    }
  ).then((res) => res.json());

  // @ts-ignore
  const cid = ipfsData?.results?.[0]?.pin?.cid;
  return cid;
}
