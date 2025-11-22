import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getApiInfo() {
    return {
      name: 'FieldPro API',
      version: '1.0.0',
      description: 'Field Service Management REST API',
      environment: this.configService.get('NODE_ENV', 'development'),
      documentation: `http://localhost:${this.configService.get('PORT', 3001)}/${this.configService.get('SWAGGER_PATH', 'api/docs')}`,
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        customers: '/api/v1/customers',
        jobs: '/api/v1/jobs',
        technicians: '/api/v1/technicians',
      },
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
    };
  }
}
