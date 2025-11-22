import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ProfitabilityRecordsService } from './profitability-records.service';
import { CreateProfitabilityRecordDto } from './dto/create-profitability-record.dto';
import { UpdateProfitabilityRecordDto } from './dto/update-profitability-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Profitability Records')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('profitability-records')
export class ProfitabilityRecordsController {
  constructor(private readonly service: ProfitabilityRecordsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create profitability record' })
  create(@Body() createDto: CreateProfitabilityRecordDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all profitability records' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get profitability record by job ID' })
  findByJob(@Param('jobId') jobId: string) {
    return this.service.findByJob(jobId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get profitability record by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update profitability record' })
  update(@Param('id') id: string, @Body() updateDto: UpdateProfitabilityRecordDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete profitability record' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
