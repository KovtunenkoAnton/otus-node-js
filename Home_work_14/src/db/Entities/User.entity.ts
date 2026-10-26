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

    @Column({ length: 1024, unique: true })
    email: string;

    @Column({ length: 1024 })
    passwordHash: string;

    @Column()
    role: EUserRole;

    @Column()
    status: EUserStatus;

    /** Копия пользователя без хэша пароля — безопасно отдавать в ответах API */
    toPublic() {
        const { passwordHash, ...rest } = this;
        return rest;
    }
}