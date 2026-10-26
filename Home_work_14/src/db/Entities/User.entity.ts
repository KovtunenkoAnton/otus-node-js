import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { EUserRole, EUserStatus } from '../../constants.js';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 1024 })
    name: string;

    @Column({ length: 1024 })
    email: string;

    @Column()
    role: EUserRole;

    @Column()
    status: EUserStatus;
}