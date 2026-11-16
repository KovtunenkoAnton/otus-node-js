import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ETaskStatus } from '../../constants.js';
import { User } from './User.entity.js';
import { Tag } from './Tag.entity.js';

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 256 })
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'varchar' })
    status: ETaskStatus;

    @ManyToOne(() => User)
    author: User;

    @ManyToMany(() => Tag, (tag) => tag.tasks)
    @JoinTable()
    tags: Tag[];
}
