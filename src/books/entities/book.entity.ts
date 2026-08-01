import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Author } from '../../authors/entities/author.entity';
import { Loan } from '../../loans/entities/loan.entity';
import { Category } from '../../categories/entities/category.entity';

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

    @ManyToMany(() => Category, (category) => category.books)
    @JoinTable({
        name: 'book_categories',
        joinColumn: { name: 'bookId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
    })
    categories: Category[];
}
