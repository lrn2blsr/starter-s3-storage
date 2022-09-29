import dotenv from 'dotenv'
dotenv.config()
import { config } from './config'
import { S3, _Error } from '@aws-sdk/client-s3'
import { Request, Response } from 'express'
import { PassThrough } from 'stream'

const s3 = new S3({})

export async function handleDownload(req: Request, res: Response) {
  try {
    let s3File = await s3.getObject({
      Bucket: config.bucket,
      Key: 'newsletter.zip',
    })

    const stream = PassThrough.from(s3File.Body!)
    res.attachment('newsletter.zip')
    stream.pipe(res)
  } catch (error) {
    if ((error as _Error).Code === 'NoSuchKey') {
      console.log(`No such key`)
      res.status(404).json({ msg: 'No files bucket' })
    } else {
      console.log(error)
      res.status(500).json({ msg: 'Something went wrong' })
    }
  }
}
