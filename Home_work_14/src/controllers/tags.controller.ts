import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TagService } from '../services/tag.service.js';
import { Tag } from '../db/Entities/Tag.entity.js';
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

    @ApiOperation({ summary: 'Создание тега (admin)' })
    @Post()
    async createTag(@Body() tag: TagDto, currentUserId: number) {
        await this.tagsService.createTag(currentUserId, tag)
    }

    @ApiOperation({ summary: 'Обновление тега (admin)' })
    @Put(':id')
    async updateTag(@Param('id') id: number, currentUserId: number, @Body() tag: TagDto) {
        await this.tagsService.updateTag(id, currentUserId, tag)
    }

    @ApiOperation({ summary: 'Удаление тега (admin)' })
    @Delete(':id')
    async deleteTag(@Param('id') id: number, currentUserId: number) {
        await this.tagsService.deleteTag(id, currentUserId)
    }
}
