require('dotenv').config()
const express = require('express')
const app = express()
const AWS = require('aws-sdk')

const s3 = new AWS.S3()

const bodyParser = require('body-parser')

const multer = require('multer')
const upload = multer()

const archiver = require('archiver')
const fs = require('fs')
const path = require('path')

app.use(bodyParser.json())

app.post('/files', upload.array('test'), async (req, res) => {
  const archive = archiver('zip', {
    zlib: { level: 9 },
  })
  const output = fs.createWriteStream('newsletter.zip')

  output.on('close', function () {
    console.log(archive.pointer() + ' total bytes')
    console.log(
      'archiver has been finalized and the output file descriptor has closed.'
    )
  })

  archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
      console.log('warning')
    } else {
      // throw error
      throw err
    }
  })

  archive.on('error', function (err) {
    throw err
  })

  archive.pipe(output)

  try {
    for await (let file of req.files) {
      archive.append(file.buffer, { name: `${file.originalname}` })
    }
  } catch (error) {
    console.error(error)
  }

  archive
    .finalize()
    .then(() => {
      s3.putObject({
        Body: output,
        Bucket: process.env.BUCKET,
        Key: 'test',
      }).promise()
    })
    .catch(console.log)

  res.set('Content-type', 'text/plain')
  res.send('ok').end()
})

// ***************************************

app.get('/files', async (req, res) => {
  // let filename = req.path.slice(1)

  try {
    let s3File = await s3
      .getObject({
        Bucket: process.env.BUCKET,
        Key: 'test',
      })
      .promise()

    res.attachment('newsletter.zip')
    const fileStream = fs.createReadStream(s3File.Body)
    fileStream.pipe(res)
  } catch (error) {
    if (error.code === 'NoSuchKey') {
      console.log(`No such key`)
      res.sendStatus(404).end()
    } else {
      console.log(error)
      res.sendStatus(500).end()
    }
  }
})

app.delete('*', async (req, res) => {
  let filename = req.path.slice(1)

  await s3
    .deleteObject({
      Bucket: process.env.BUCKET,
      Key: filename,
    })
    .promise()

  res.set('Content-type', 'text/plain')
  res.send('ok').end()
})

app.use('*', (req, res) => {
  res.sendStatus(404).end()
})

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`index.js listening at http://localhost:${port}`)
})
