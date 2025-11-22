import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole, RecurringFrequency } from '@prisma/client';
import { RecurringJobsService } from './recurring-jobs.service';
import { CreateRecurringJobDto } from './dto/create-recurring-job.dto';
import { UpdateRecurringJobDto } from './dto/update-recurring-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Recurring Jobs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recurring-jobs')
export class RecurringJobsController {
  constructor(private readonly recurringJobsService: RecurringJobsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new recurring job' })
  @ApiResponse({
    status: 201,
    description: 'Recurring job created successfully',
  })
  @ApiResponse({ status: 404, description: 'Customer or Technician not found' })
  @ApiResponse({ status: 400, description: 'Invalid date range' })
  create(@Body() createRecurringJobDto: CreateRecurringJobDto) {
    return this.recurringJobsService.create(createRecurringJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all recurring jobs with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'frequency', required: false, enum: RecurringFrequency })
  @ApiResponse({ status: 200, description: 'List of recurring jobs' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
    @Query('customerId') customerId?: string,
    @Query('frequency') frequency?: RecurringFrequency,
  ) {
    return this.recurringJobsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      active !== undefined ? active === 'true' : undefined,
      customerId,
      frequency,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get recurring job statistics' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiResponse({ status: 200, description: 'Recurring job statistics' })
  getStatistics(@Query('customerId') customerId?: string) {
    return this.recurringJobsService.getStatistics(customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recurring job by ID' })
  @ApiResponse({ status: 200, description: 'Recurring job found' })
  @ApiResponse({ status: 404, description: 'Recurring job not found' })
  findOne(@Param('id') id: string) {
    return this.recurringJobsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update recurring job' })
  @ApiResponse({
    status: 200,
    description: 'Recurring job updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Recurring job not found' })
  update(
    @Param('id') id: string,
    @Body() updateRecurringJobDto: UpdateRecurringJobDto,
  ) {
    return this.recurringJobsService.update(id, updateRecurringJobDto);
  }

  @Patch(':id/next-occurrence')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update next occurrence (after job generation)' })
  @ApiResponse({ status: 200, description: 'Next occurrence updated' })
  @ApiResponse({ status: 404, description: 'Recurring job not found' })
  updateNextOccurrence(@Param('id') id: string) {
    return this.recurringJobsService.updateNextOccurrence(id);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle recurring job active status' })
  @ApiResponse({ status: 200, description: 'Status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Recurring job not found' })
  toggleActive(@Param('id') id: string) {
    return this.recurringJobsService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete recurring job (Admin only)' })
  @ApiResponse({ status: 200, description: 'Recurring job deleted' })
  @ApiResponse({ status: 404, description: 'Recurring job not found' })
  remove(@Param('id') id: string) {
    return this.recurringJobsService.remove(id);
  }
}
