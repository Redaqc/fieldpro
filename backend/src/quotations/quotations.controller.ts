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
import { UserRole, QuotationStatus } from '@prisma/client';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Quotations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new quotation' })
  @ApiResponse({ status: 201, description: 'Quotation created successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 409, description: 'Quote number already exists' })
  @ApiResponse({ status: 400, description: 'Invalid date range' })
  create(@Body() createQuotationDto: CreateQuotationDto) {
    return this.quotationsService.create(createQuotationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quotations with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: QuotationStatus })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in quote number, title, description',
  })
  @ApiResponse({ status: 200, description: 'List of quotations' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: QuotationStatus,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
  ) {
    return this.quotationsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
      customerId,
      search,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get quotation statistics' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiResponse({ status: 200, description: 'Quotation statistics' })
  getStatistics(@Query('customerId') customerId?: string) {
    return this.quotationsService.getStatistics(customerId);
  }

  @Post('mark-expired')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark expired quotations as EXPIRED (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Expired quotations marked successfully',
  })
  markExpired() {
    return this.quotationsService.markExpiredQuotations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quotation by ID with customer data' })
  @ApiResponse({ status: 200, description: 'Quotation found' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update quotation' })
  @ApiResponse({ status: 200, description: 'Quotation updated successfully' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  @ApiResponse({ status: 409, description: 'Quote number already exists' })
  update(
    @Param('id') id: string,
    @Body() updateQuotationDto: UpdateQuotationDto,
  ) {
    return this.quotationsService.update(id, updateQuotationDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update quotation status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: QuotationStatus,
  ) {
    return this.quotationsService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete quotation (Admin only)' })
  @ApiResponse({ status: 200, description: 'Quotation deleted' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  remove(@Param('id') id: string) {
    return this.quotationsService.remove(id);
  }
}
