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
import { UserRole, JobStatus } from '@prisma/client';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Jobs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  create(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(createJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: JobStatus })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'technicianId', required: false })
  @ApiResponse({ status: 200, description: 'List of jobs' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: JobStatus,
    @Query('customerId') customerId?: string,
    @Query('technicianId') technicianId?: string,
  ) {
    return this.jobsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
      customerId,
      technicianId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID with all related data' })
  @ApiResponse({ status: 200, description: 'Job found' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update job' })
  @ApiResponse({ status: 200, description: 'Job updated successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
    return this.jobsService.update(id, updateJobDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update job status' })
  @ApiResponse({ status: 200, description: 'Job status updated' })
  updateStatus(@Param('id') id: string, @Body('status') status: JobStatus) {
    return this.jobsService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete job (Admin only)' })
  @ApiResponse({ status: 200, description: 'Job deleted' })
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}
