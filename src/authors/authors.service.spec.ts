import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthorsService } from './authors.service';
import { Author } from './entities/author.entity';

type MockRepository = Partial<Record<keyof Repository<Author>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('AuthorsService', () => {
  let service: AuthorsService;
  let repository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        {
          provide: getRepositoryToken(Author),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    repository = module.get(getRepositoryToken(Author));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return an author', async () => {
      const dto = { firstName: 'George', lastName: 'Orwell' };
      const created = { id: '1', ...dto };
      repository.create!.mockReturnValue(created);
      repository.save!.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result.firstName).toBe('George');
    });
  });

  describe('findOne', () => {
    it('should return an author when found', async () => {
      const author = { id: '1', firstName: 'George', lastName: 'Orwell' };
      repository.findOne!.mockResolvedValue(author);

      const result = await service.findOne('1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException when author does not exist', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove an existing author', async () => {
      const author = { id: '1', firstName: 'George', lastName: 'Orwell' };
      repository.findOne!.mockResolvedValue(author);
      repository.remove!.mockResolvedValue(author);

      await service.remove('1');

      expect(repository.remove).toHaveBeenCalledWith(author);
    });

    it('should throw NotFoundException when removing a missing author', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
