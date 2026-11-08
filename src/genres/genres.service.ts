import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGenreDto } from './dto/create-genre.dto.js';
import { UpdateGenreDto } from './dto/update-genre.dto.js';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGenreDto) {
    const existing = await this.prisma.genre.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Genre "${dto.name}" already exists`);
    }

    return this.prisma.genre.create({
      data: { name: dto.name },
    });
  }

  async findAll() {
    return this.prisma.genre.findMany({
      include: {
        _count: {
          select: { books: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      include: {
        books: true,
      },
    });

    if (!genre) {
      throw new NotFoundException(`Genre with ID ${id} not found`);
    }

    return genre;
  }

  async update(id: number, dto: UpdateGenreDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.genre.findUnique({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Genre "${dto.name}" already exists`);
      }
    }

    return this.prisma.genre.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Check if books are attached to this genre
    const bookCount = await this.prisma.book.count({
      where: { genreId: id },
    });

    if (bookCount > 0) {
      throw new ConflictException(`Cannot delete genre with ID ${id} because it still has ${bookCount} associated books`);
    }

    return this.prisma.genre.delete({
      where: { id },
    });
  }
}
