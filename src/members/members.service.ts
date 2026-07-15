import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberResponseDto } from './dto/member-response.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  async create(dto: CreateMemberDto): Promise<MemberResponseDto> {
    const member = this.memberRepository.create(dto);
    const saved = await this.memberRepository.save(member);
    return new MemberResponseDto(saved);
  }

  async findAll(): Promise<MemberResponseDto[]> {
    const members = await this.memberRepository.find();
    return members.map((member) => new MemberResponseDto(member));
  }

  async findOne(id: string): Promise<MemberResponseDto> {
    const member = await this.getOrThrow(id);
    return new MemberResponseDto(member);
  }

  async update(id: string, dto: UpdateMemberDto): Promise<MemberResponseDto> {
    const member = await this.getOrThrow(id);
    Object.assign(member, dto);
    const saved = await this.memberRepository.save(member);
    return new MemberResponseDto(saved);
  }

  async remove(id: string): Promise<void> {
    const member = await this.getOrThrow(id);
    await this.memberRepository.remove(member);
  }

  private async getOrThrow(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member with id ${id} not found`);
    }
    return member;
  }
}
