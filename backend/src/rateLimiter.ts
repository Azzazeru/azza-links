import { RequestHandler } from "express"
import rateLimit from "express-rate-limit"

export const createLimiter = (windowMs: number, max: number, message: string): RequestHandler =>
  rateLimit({ windowMs, max, message, standardHeaders: true, legacyHeaders: false })


export const limiters = {
  createLink: createLimiter(60 * 1000, 5, "Demasiados intentos. Por favor, inténtalo de nuevo en un minuto."),
  getStats: createLimiter(60 * 1000, 10, "Demasiados intentos. Por favor, inténtalo de nuevo en un minuto."),
  getLink: createLimiter(60 * 1000, 20, "Demasiados intentos. Por favor, inténtalo de nuevo en un minuto."),
  modify: createLimiter(60 * 1000, 5, "Demasiados intentos. Por favor, inténtalo de nuevo en un minuto."),
}