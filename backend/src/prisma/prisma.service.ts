import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'query', emit: 'event' },
      ],
    });

    // Log Prisma queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    this.$on('warn' as never, (e: any) => {
      this.logger.warn(e);
    });

    this.$on('error' as never, (e: any) => {
      this.logger.error(e);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  /**
   * Clean all data from database (useful for testing)
   * WARNING: Only use in test/development environments
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => key !== '_engine' && key !== '_fetcher' && key !== '_connectionPromise',
    );

    return Promise.all(models.map((modelKey) => (this as any)[modelKey]?.deleteMany?.()));
  }
}
