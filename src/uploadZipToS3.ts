import dotenv from 'dotenv'
dotenv.config()

import { createReadStream, existsSync, mkdirSync, unlink } from 'node:fs'
import path from 'path'

import { config } from './config'

import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

export async function uploadZipToS3() {
  const filePath = path.join(__dirname, 'tmp', 'newsletter.zip')
  const stream = createReadStream(filePath)
  const upload = new Upload({
    params: {
      Bucket: config.bucket,
      Key: 'newsletter.zip',
      Body: stream,
    },
    client: new S3({}),
  })

  upload.on('httpUploadProgress', (progress) => console.log(progress))

  await upload.done()

  unlink(filePath, (err) => {
    if (err) throw err
    console.log(`File ${filePath} was successfully deleted`)
  })
}
