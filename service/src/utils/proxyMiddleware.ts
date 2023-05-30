import type * as http from 'http'
import type { Request, Response } from 'express'
import type { Options } from 'http-proxy-middleware'
import { createProxyMiddleware } from 'http-proxy-middleware'
export async function forwardRequest(req: Request, res: Response, targetUrl: string, pathRewrite = ''): Promise<void> {
  try {
    const proxyRes: http.IncomingMessage = await new Promise((resolve, reject) => {
      const options: Options = {
        target: targetUrl,
        changeOrigin: true,
        pathRewrite: {
          // '^/api': '',
          [pathRewrite]: '',
        },
        onProxyRes: resolve,
        onError: reject,
      }
      createProxyMiddleware(options)(req, res, () => {})
    })
    res.status(proxyRes.statusCode).send((proxyRes as any).body)
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
}
