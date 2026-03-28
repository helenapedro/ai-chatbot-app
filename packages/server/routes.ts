import express from 'express';
import type { Request, Response } from 'express';

import { chatController } from './controllers/chat.controller';
import { checkDatabaseHealth } from './db/mysql';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
   res.send('Hi Helena!');
});

router.get('/healthz', (_req: Request, res: Response) => {
   res.json({ status: 'ok' });
});

router.get('/readyz', async (_req: Request, res: Response) => {
   const isDatabaseHealthy = await checkDatabaseHealth();

   if (!isDatabaseHealthy) {
      res.status(503).json({ status: 'not_ready' });
      return;
   }

   res.json({ status: 'ready' });
});

router.get('/api/hello', (req: Request, res: Response) => {
   res.json({ message: 'Hi Helena!' });
});

router.get(
   '/api/conversations/:conversationId/messages',
   chatController.getMessageHistory
);

router.post('/api/chat', chatController.sendMessage);

export default router;
