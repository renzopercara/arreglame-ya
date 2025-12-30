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
      
      // Provide helpful hints for common errors using error codes
      const errorCode = (error as any)?.errorCode || (error as any)?.code;
      
      if (errorCode === 'P1012' || error.message?.includes('Environment variable not found')) {
        this.logger.error('💡 Hint: Make sure DATABASE_URL is set in your .env file');
      } else if (errorCode === 'P1001' || error.message?.includes('Can\'t reach database')) {
        this.logger.error('💡 Hint: Make sure your database server is running');
        this.logger.error('   Try: npm run db:up (to start Docker Postgres)');
      } else if (errorCode === 'P1002' || error.message?.includes('timed out')) {
        this.logger.error('💡 Hint: Database server took too long to respond');
      } else if (errorCode === 'P1003' || error.message?.includes('does not exist')) {
        this.logger.error('💡 Hint: The specified database does not exist');
      } else if (error.message?.includes('Authentication failed') || error.message?.includes('password authentication failed')) {
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
