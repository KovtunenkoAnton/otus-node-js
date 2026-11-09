import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TagService } from '../services/tag.service.js';
import { Tag } from '../db/Entities/Tag.entity.js';
import { EUserRole } from '../constants.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from '../decorators/roles.decorator.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { TagDto } from '../dto/tag.dto.js';

@ApiTags('tags')
@Controller('/tags')
export class TagsController {
    constructor(private readonly tagsService: TagService) { }

    @ApiOperation({ summary: 'Список тегов' })
    @Get()
    getAll(): Promise<Tag[]> {
        return this.tagsService.getAll();
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Создание тега (admin)' })
    @Post()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(EUserRole.Admin)
    async createTag(
        @Body() tag: TagDto,
        @CurrentUser('id') currentUserId: number,
    ) {
        await this.tagsService.createTag(currentUserId, tag);
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Обновление тега (admin)' })
    @Put(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(EUserRole.Admin)
    async updateTag(
        @Param('id') id: number,
        @CurrentUser('id') currentUserId: number,
        @Body() tag: TagDto,
    ) {
        await this.tagsService.updateTag(id, currentUserId, tag);
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Удаление тега (admin)' })
    @Delete(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(EUserRole.Admin)
    async deleteTag(@Param('id') id: number, @CurrentUser('id') currentUserId: number) {
        await this.tagsService.deleteTag(id, currentUserId);
    }
}
