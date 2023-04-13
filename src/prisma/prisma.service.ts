import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(configModule: ConfigService) {
    super({
      datasources: {
        db: {
          url: configModule.getOrThrow('DATABASE_URL'),
        },
      },
    });
  }
}
