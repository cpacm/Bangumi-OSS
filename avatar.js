/*
 * @Author: czy0729
 * @Date: 2020-01-17 21:10:52
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-06-27 14:48:30
 */
const fs = require('fs')
const path = require('path')
const join = require('path').join
const http = require('http')
const utils = require('./utils/utils')

const quality = 'l'

const filePaths = []
function findJsonFile(path) {
  fs.readdirSync(path).forEach((item, index) => {
    const fPath = join(path, item)
    const stat = fs.statSync(fPath)
    if (stat.isDirectory() === true) {
      findJsonFile(fPath)
    }
    if (stat.isFile() === true && !fPath.includes('.DS_Store')) {
      filePaths.push(fPath)
    }
  })
}

/**
 * Topic
 */
// findJsonFile('../Bangumi-Rakuen/data/topic')
// const avatars = Array.from(
//   new Set(filePaths.map((item) => JSON.parse(fs.readFileSync(item)).avatar))
// )

/**
 * Comment
 */
findJsonFile('../Bangumi-Rakuen/data/comment')
const temp = []
filePaths.forEach((item) => {
  const data = JSON.parse(fs.readFileSync(item))
  data.forEach((item) => {
    if (item.avatar) {
      temp.push(item.avatar)
    }
    item.sub.forEach((i) => {
      if (i.avatar) {
        temp.push(i.avatar)
      }
    })
  })
})
const avatars = Array.from(new Set(temp))

async function downloadAvatar(avatar) {
  try {
    const hash = utils.hash(`https:${avatar}`)
    const filePath = `./data/avatar/m/${hash
      .slice(0, 1)
      .toLowerCase()}/${hash}.jpg`
    if (fs.existsSync(filePath)) {
      // console.log(`- skip ${avatar}`)
      return true
    }

    const src = `http:${avatar}`.replace('/m/', '/l/')
    http.get(`${src}?r=${utils.getTimestamp()}`, (req, res) => {
      let imgData = ''
      req.setEncoding('binary')
      req.on('data', (chunk) => (imgData += chunk))
      req.on('end', () => {
        const dirPath = path.dirname(filePath)
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath)
        }

        console.log(
          `- write ${src} [${avatars.indexOf(avatar)} / ${avatars.length}]`
        )
        fs.writeFileSync(filePath, imgData, 'binary', (err) => {
          if (err) console.log('- error ${avatar}')
        })

        return true
      })
    })
  } catch (error) {
    return downloadAvatar(avatar)
  }
}

const fetchs = avatars.map((item) => () => downloadAvatar(item))
utils.queue(fetchs, 48)
