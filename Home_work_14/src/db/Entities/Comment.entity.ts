import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ECommentStatus } from '../../constants.js';
import { User } from './User.entity.js';
import { Task } from './Task.entity.js';

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    content: string;

    @Column()
    status: ECommentStatus;

    @ManyToOne(() => User)
    author: User;

    @ManyToOne(() => Task)
    task: Task;
}
