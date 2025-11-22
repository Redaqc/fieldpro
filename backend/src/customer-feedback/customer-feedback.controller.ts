import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CustomerFeedbackService } from './customer-feedback.service';
import { CreateCustomerFeedbackDto } from './dto/create-customer-feedback.dto';
import { UpdateCustomerFeedbackDto } from './dto/update-customer-feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Customer Feedback')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customer-feedback')
export class CustomerFeedbackController {
  constructor(private readonly service: CustomerFeedbackService) {}
  @Post() @ApiOperation({ summary: 'Create customer feedback' })
  create(@Body() dto: CreateCustomerFeedbackDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'Get all feedback' }) @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'customerId', required: false }) @ApiQuery({ name: 'jobId', required: false }) @ApiQuery({ name: 'minRating', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('customerId') customerId?: string, @Query('jobId') jobId?: string, @Query('minRating') minRating?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, customerId, jobId, minRating ? parseInt(minRating) : undefined);
  }
  @Get(':id') @ApiOperation({ summary: 'Get feedback by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: 'Update feedback' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerFeedbackDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Delete feedback' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
