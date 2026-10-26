import { Module } from '@nestjs/common';
import { AppService } from './app.service.js';
import { providers } from './db/dbProvider.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { connection } from './db/connection.js';
import { Comment } from './db/Entities/Comment.entity.js'
import { Tag } from './db/Entities/Tag.entity.js';
import { Task } from './db/Entities/Task.entity.js';
import { User } from './db/Entities/User.entity.js';
import { CommentsController } from './controllers/comments.controller.js';
import { TagsController } from './controllers/tags.controller.js';
import { TasksController } from './controllers/tasks.controller.js';
import { UsersController } from './controllers/users.controller.js';
import { UserService } from './services/user.service.js';
import { TaskService } from './services/task.service.js';
import { TagService } from './services/tag.service.js';
import { CommentService } from './services/comment.service.js';


@Module({
  imports: [
    TypeOrmModule.forRoot(connection),
    TypeOrmModule.forFeature([Comment, Tag, Task, User]),
  ],
  controllers: [CommentsController, TagsController, TasksController, UsersController],
  providers: [AppService, providers, UserService, TaskService, TagService, CommentService],
})
export class AppModule {}
