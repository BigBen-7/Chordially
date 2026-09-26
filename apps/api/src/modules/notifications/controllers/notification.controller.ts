import { Controller, Get, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Controller('notifications')
export class NotificationController {
  @Get()
  async list(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-081 paginated notifications
      return res.status(200).json({ items: [], unreadCount: 0 });
    } catch (error) { next(error); }
  }
}
