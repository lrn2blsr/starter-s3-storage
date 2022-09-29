import archiver from 'archiver'
import { PassThrough } from 'stream'

export async function archiveFiles(
  files: Express.Multer.File[],
  throughStream: PassThrough
) {
  const archive = archiver('zip', {
    zlib: { level: 9 },
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

  archive.pipe(throughStream)

  for (let file of files) {
    archive.append(file.buffer, { name: `${file.originalname}` })
  }

  await archive.finalize()
}
