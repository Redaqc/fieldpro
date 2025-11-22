import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TeamMessageService } from './team-message.service';
import { CreateTeamMessageDto } from './dto/create-team-message.dto';
import { UpdateTeamMessageDto } from './dto/update-team-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Team Messages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('team-message')
export class TeamMessageController {
  constructor(private readonly service: TeamMessageService) {}

  @Post()
  @ApiOperation({ summary: 'Create team message' })
  create(@Body() dto: CreateTeamMessageDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all team messages' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'senderEmail', required: false })
  @ApiQuery({ name: 'recipientEmail', required: false })
  @ApiQuery({ name: 'channel', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('senderEmail') senderEmail?: string,
    @Query('recipientEmail') recipientEmail?: string,
    @Query('channel') channel?: string,
  ) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, senderEmail, recipientEmail, channel);
  }

  @Get('conversation/:email1/:email2')
  @ApiOperation({ summary: 'Get conversation between two users' })
  findConversation(@Param('email1') email1: string, @Param('email2') email2: string) {
    return this.service.findConversation(email1, email2);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team message by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team message' })
  update(@Param('id') id: string, @Body() dto: UpdateTeamMessageDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete team message' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
