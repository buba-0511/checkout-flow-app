import { TextDecoder, TextEncoder } from 'node:util'
import '@testing-library/jest-dom'

// jsdom doesn't provide these — react-router-dom needs them at import time.
Object.assign(globalThis, { TextEncoder, TextDecoder })
