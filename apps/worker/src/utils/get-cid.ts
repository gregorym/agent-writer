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
