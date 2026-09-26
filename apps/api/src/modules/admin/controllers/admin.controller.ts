import { Controller, Get, Patch, Param, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Controller('admin')
export class AdminController {
  @Get('audit-log')
  async getAuditLog(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-093
      return res.status(200).json({ logs: [] });
    } catch (error) { next(error); }
  }

  @Patch('creators/:id/verify')
  async verifyCreator(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-092
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }
}
