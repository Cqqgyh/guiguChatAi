import express from 'express'
import type { RequestProps } from './types'
import type { ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess, currentModel } from './chatgpt'
import { auth } from './middleware/auth'
import { limiter } from './middleware/limiter'
import { forwardRequest } from './utils/proxyMiddleware'
const app = express()
const router = express.Router()

app.use(express.static('public'))
app.use(express.json())
app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})

router.post('/chat-process', [auth, limiter], async (req, res) => {
  res.setHeader('Content-type', 'application/octet-stream')

  try {
    const { prompt, options = {}, systemMessage, temperature, top_p } = req.body as RequestProps
    let firstChunk = true
    await chatReplyProcess({
      message: prompt,
      lastContext: options,
      process: (chat: ChatMessage) => {
        res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
        firstChunk = false
      },
      systemMessage,
      temperature,
      top_p,
    })
  }
  catch (error) {
    res.write(JSON.stringify(error))
  }
  finally {
    res.end()
  }
})

router.post('/config', auth, async (req, res) => {
  try {
    const response = await chatConfig()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/session', async (req, res) => {
  try {
    const { Authorization } = req.body as { Authorization: string }
    const hasAuth = !Authorization?.replace('Bearer ', '').trim()
    res.send({ status: 'Success', message: '', data: { auth: hasAuth, model: currentModel() } })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.get('/validate/gpt/:phone', async (req, res) => {
  try {
    const targetUrl = 'http://47.93.118.241:8888/api'
    await forwardRequest(req, res, targetUrl)
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})
router.get('/gptLogin/:phone/:code', async (req, res) => {
  try {
    const targetUrl = 'http://47.93.118.241:8888/api'
    await forwardRequest(req, res, targetUrl)
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})
app.use('', router)
app.use('/api', router)
app.set('trust proxy', 1)

app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))
