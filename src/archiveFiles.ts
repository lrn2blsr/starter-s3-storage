import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { uploadZipToS3 } from './uploadZipToS3'

export async function archiveFiles(files: Express.Multer.File[]) {
  const archive = archiver('zip', {
    zlib: { level: 9 },
  })

  const output = fs.createWriteStream(path.join(__dirname, 'newsletter.zip'))

  output.on('close', function () {
    console.log(archive.pointer() + ' total bytes')
    console.log(
      'archiver has been finalized and the output file descriptor has closed.'
    )
    // uploadZipToS3()
  })

  archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
      console.log('warning')
    } else {
      throw err
    }
  })

  archive.on('error', function (err) {
    throw err
  })

  archive.pipe(output)

  for (let file of files) {
    archive.append(file.buffer, { name: `${file.originalname}` })
  }

  await archive.finalize()
}
