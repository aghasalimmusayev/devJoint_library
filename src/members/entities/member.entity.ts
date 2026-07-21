import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Loan } from '../../loans/entities/loan.entity';

@Entity('members')
export class Member extends BaseEntity {
  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'date' })
  membershipDate: string;

  @OneToMany(() => Loan, (loan) => loan.member)
  loans: Loan[];
}
