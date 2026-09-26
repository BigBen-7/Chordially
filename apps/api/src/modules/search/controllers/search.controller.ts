import { Controller, Get, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Controller('search')
export class SearchController {
  @Get('creators')
  async searchCreators(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-085
      return res.status(200).json({ results: [] });
    } catch (error) { next(error); }
  }
}
