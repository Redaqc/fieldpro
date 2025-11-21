#!/bin/bash

set -e

BACKEND="/home/user/fieldpro/backend/src"

echo "💼 Generating Business modules (Customers, Jobs)..."

# ===========================
# CUSTOMERS MODULE
# ===========================

cat > "$BACKEND/customers/customers.module.ts" << 'EOF'
import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
EOF

cat > "$BACKEND/customers/customers.service.ts" << 'EOF'
import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private tenantPrisma: TenantPrismaService) {}

  async findAll() {
    return this.tenantPrisma.queryRaw(`
      SELECT * FROM {schema}.customers
      WHERE is_sample = false
      ORDER BY created_date DESC
    `);
  }

  async findOne(id: string) {
    const customer = await this.tenantPrisma.findOne('customers', id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async create(createCustomerDto: CreateCustomerDto, userId: string, userEmail: string) {
    const data = {
      ...createCustomerDto,
      id: this.generateUUID(),
      tags: JSON.stringify(createCustomerDto.tags || []),
      status: createCustomerDto.status || 'active',
      created_date: new Date(),
      updated_date: new Date(),
      created_by_id: userId,
      created_by: userEmail,
      is_sample: false,
    };

    return this.tenantPrisma.create('customers', data);
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id);
    
    const data: any = {};
    Object.keys(updateCustomerDto).forEach(key => {
      if (updateCustomerDto[key] !== undefined) {
        if (key === 'tags') {
          data[key] = JSON.stringify(updateCustomerDto[key]);
        } else {
          data[key] = updateCustomerDto[key];
        }
      }
    });

    return this.tenantPrisma.update('customers', id, data);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.tenantPrisma.delete('customers', id);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
EOF

cat > "$BACKEND/customers/customers.controller.ts" << 'EOF'
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create customer' })
  create(@Body() createCustomerDto: CreateCustomerDto, @CurrentUser() user: any) {
    return this.customersService.create(createCustomerDto, user.sub, user.email);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
EOF

cat > "$BACKEND/customers/dto/create-customer.dto.ts" << 'EOF'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  first_name: string;

  @ApiProperty()
  @IsString()
  last_name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  company_name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;
}
EOF

cat > "$BACKEND/customers/dto/update-customer.dto.ts" << 'EOF'
import { PartialType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
EOF

# ===========================
# JOBS MODULE
# ===========================

cat > "$BACKEND/jobs/jobs.module.ts" << 'EOF'
import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
EOF

cat > "$BACKEND/jobs/jobs.service.ts" << 'EOF'
import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(private tenantPrisma: TenantPrismaService) {}

  async findAll() {
    return this.tenantPrisma.queryRaw(`
      SELECT * FROM {schema}.jobs
      WHERE is_sample = false
      ORDER BY created_date DESC
    `);
  }

  async findOne(id: string) {
    const job = await this.tenantPrisma.findOne('jobs', id);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async create(createJobDto: CreateJobDto, userId: string, userEmail: string) {
    const jobNumber = await this.generateJobNumber();
    
    const data = {
      id: this.generateUUID(),
      job_number: jobNumber,
      title: createJobDto.title,
      description: createJobDto.description || '',
      status: createJobDto.status || 'todo',
      priority: createJobDto.priority || 'medium',
      technicians: JSON.stringify(createJobDto.technicians || []),
      labels: JSON.stringify(createJobDto.labels || []),
      checklist: JSON.stringify(createJobDto.checklist || []),
      milestones: JSON.stringify(createJobDto.milestones || []),
      comments: JSON.stringify([]),
      activity_log: JSON.stringify([{
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'created',
        details: 'Job created'
      }]),
      customer_id: createJobDto.customer_id,
      customer_name: createJobDto.customer_name,
      due_date: createJobDto.due_date,
      is_overdue: false,
      created_date: new Date(),
      updated_date: new Date(),
      created_by_id: userId,
      created_by: userEmail,
      is_sample: false,
    };

    return this.tenantPrisma.create('jobs', data);
  }

  async update(id: string, updateJobDto: UpdateJobDto, userEmail: string) {
    const job = await this.findOne(id);
    
    const data: any = {};
    Object.keys(updateJobDto).forEach(key => {
      if (updateJobDto[key] !== undefined) {
        if (['technicians', 'labels', 'checklist', 'milestones'].includes(key)) {
          data[key] = JSON.stringify(updateJobDto[key]);
        } else {
          data[key] = updateJobDto[key];
        }
      }
    });

    if (updateJobDto.status && updateJobDto.status !== job.status) {
      const activityLog = job.activity_log || [];
      activityLog.push({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'status_changed',
        details: `Status changed from "${job.status}" to "${updateJobDto.status}"`
      });
      data.activity_log = JSON.stringify(activityLog);
    }

    return this.tenantPrisma.update('jobs', id, data);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.tenantPrisma.delete('jobs', id);
  }

  private async generateJobNumber(): Promise<string> {
    const count = await this.tenantPrisma.queryRaw(`
      SELECT COUNT(*) as count FROM {schema}.jobs
    `);
    const num = (parseInt(count[0].count) + 1).toString().padStart(6, '0');
    return `JOB-${num}`;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
EOF

cat > "$BACKEND/jobs/jobs.controller.ts" << 'EOF'
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create job' })
  create(@Body() createJobDto: CreateJobDto, @CurrentUser() user: any) {
    return this.jobsService.create(createJobDto, user.sub, user.email);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs' })
  findAll() {
    return this.jobsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update job' })
  update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @CurrentUser() user: any,
  ) {
    return this.jobsService.update(id, updateJobDto, user.email);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete job' })
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}
EOF

cat > "$BACKEND/jobs/dto/create-job.dto.ts" << 'EOF'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  technicians?: any[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  labels?: any[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  checklist?: any[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  milestones?: any[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customer_id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customer_name?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  due_date?: string;
}
EOF

cat > "$BACKEND/jobs/dto/update-job.dto.ts" << 'EOF'
import { PartialType } from '@nestjs/swagger';
import { CreateJobDto } from './create-job.dto';

export class UpdateJobDto extends PartialType(CreateJobDto) {}
EOF

echo "✅ Business modules (Customers, Jobs) generated successfully!"

