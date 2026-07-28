import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from '../../common/enums/role.enum';
import { Gender } from '../../common/enums/gender.enum';

@Entity('users')
export class User extends BaseEntity {
    @Column()
    name: string;

    @Column()
    surname: string;

    @Column({ type: 'enum', enum: Gender })
    gender: Gender;

    @Column({ unique: true })
    email: string;

    @Column({ type: 'varchar', nullable: true })
    phone: string | null;

    @Column()
    password: string;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;
}
