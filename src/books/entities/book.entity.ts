import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Author } from '../../authors/entities/author.entity';
import { Loan } from '../../loans/entities/loan.entity';

@Entity('books')
export class Book extends BaseEntity {
    @Column()
    title: string;

    @Column({ unique: true })
    isbn: string;

    @Column({ type: 'date' })
    publishedDate: string;

    @Column({ type: 'int', default: 1 })
    totalCopies: number;

    @Column({ type: 'int', default: 1 })
    availableCopies: number;

    @ManyToOne(() => Author, (author) => author.books, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'authorId' })
    author: Author;

    @Column()
    authorId: string;

    @OneToMany(() => Loan, (loan) => loan.book)
    loans: Loan[];
}
