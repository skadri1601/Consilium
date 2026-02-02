import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@consilium/database";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Database connected successfully");
    } catch (error) {
      this.logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.logger.warn("Application will continue, but database operations may fail");
      // Don't throw - allow app to start even if DB is unavailable
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error) {
      this.logger.error(`Error disconnecting from database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
