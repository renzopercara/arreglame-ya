import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService - Database connection management
 * 
 * This service follows production best practices:
 * - Explicit connection logging
 * - Clear error messages on connection failure
 * - Proper cleanup on shutdown
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      this.logger.log('🔌 Connecting to database...');
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database');
      this.logger.error(`Error: ${error.message}`);
      
      // Provide helpful hints for common errors
      if (error.message?.includes('Environment variable not found: DATABASE_URL')) {
        this.logger.error('💡 Hint: Make sure DATABASE_URL is set in your .env file');
      } else if (error.message?.includes('Can\'t reach database server')) {
        this.logger.error('💡 Hint: Make sure your database server is running');
        this.logger.error('   Try: npm run db:up (to start Docker Postgres)');
      } else if (error.message?.includes('Authentication failed')) {
        this.logger.error('💡 Hint: Check your database credentials in DATABASE_URL');
      }
      
      // Re-throw to prevent app from starting with broken database
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('🔌 Disconnecting from database...');
      await this.$disconnect();
      this.logger.log('✅ Database disconnected successfully');
    } catch (error) {
      this.logger.error('❌ Error disconnecting from database');
      this.logger.error(error);
    }
  }
}
