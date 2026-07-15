import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Book } from '../../books/entities/book.entity';
import { Member } from '../../members/entities/member.entity';

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Book, (book) => book.loans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @Column()
  bookId: string;

  @ManyToOne(() => Member, (member) => member.loans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Column()
  memberId: string;

  @CreateDateColumn()
  borrowedAt: Date;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ type: 'timestamp', nullable: true })
  returnedAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
