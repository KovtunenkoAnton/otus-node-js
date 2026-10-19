import {
    Column,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from './Task.entity.js';

@Entity('tags')
export class Tag {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 256 })
    name: string;

    @ManyToMany(() => Task, (task) => task.tags)
    tasks: Task[];
}
