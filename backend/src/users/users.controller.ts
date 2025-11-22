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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Throttle({ default: { ttl: 60000, limit: 100 } })
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (super admin only)' })
  create(@Body() createDto: CreateUserDto) {
    return this.usersService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users (super admin only)' })
  findAll(@Query() filters: any) {
    return this.usersService.findAll(filters);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: any) {
    return this.usersService.findOne(user.sub);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get current user statistics' })
  getMyStats(@CurrentUser() user: any) {
    return this.usersService.getUserStats(user.sub);
  }

  @Get('me/tenants')
  @ApiOperation({ summary: 'Get current user tenant memberships' })
  getMyTenants(@CurrentUser() user: any) {
    return this.usersService.getUserTenants(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@CurrentUser() user: any, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(user.sub, updateDto);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Change current user password' })
  changeMyPassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.sub, changePasswordDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  getStats(@Param('id') id: string) {
    return this.usersService.getUserStats(id);
  }

  @Get(':id/tenants')
  @ApiOperation({ summary: 'Get user tenant memberships' })
  getUserTenants(@Param('id') id: string) {
    return this.usersService.getUserTenants(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user (super admin only)' })
  update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user (super admin only)' })
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Post(':id/tenants/:tenantId')
  @ApiOperation({ summary: 'Add user to tenant' })
  addToTenant(
    @Param('id') userId: string,
    @Param('tenantId') tenantId: string,
    @Body('role') role: string,
  ) {
    return this.usersService.addUserToTenant(userId, tenantId, role);
  }

  @Delete(':id/tenants/:tenantId')
  @ApiOperation({ summary: 'Remove user from tenant' })
  removeFromTenant(
    @Param('id') userId: string,
    @Param('tenantId') tenantId: string,
  ) {
    return this.usersService.removeUserFromTenant(userId, tenantId);
  }

  @Patch(':id/tenants/:tenantId/role')
  @ApiOperation({ summary: 'Update user role in tenant' })
  updateTenantRole(
    @Param('id') userId: string,
    @Param('tenantId') tenantId: string,
    @Body('role') role: string,
  ) {
    return this.usersService.updateUserRole(userId, tenantId, role);
  }
}
