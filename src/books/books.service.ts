import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';

export interface FindBooksQuery {
  genreId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookDto) {
    const genre = await this.prisma.genre.findUnique({
      where: { id: dto.genreId },
    });
    if (!genre) {
      throw new NotFoundException(`Genre with ID ${dto.genreId} not found`);
    }

    if (dto.isbn) {
      const existing = await this.prisma.book.findUnique({
        where: { isbn: dto.isbn },
      });
      if (existing) {
        throw new ConflictException(`Book with ISBN ${dto.isbn} already exists`);
      }
    }

    return this.prisma.book.create({
      data: {
        title: dto.title,
        author: dto.author,
        isbn: dto.isbn,
        publishedYear: dto.publishedYear,
        copies: dto.totalCopies,
        genreId: dto.genreId,
      },
      include: {
        genre: true,
      },
    });
  }

  async findAll(query: FindBooksQuery) {
    const page = query.page && Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = query.limit && Number(query.limit) > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {};

    if (query.genreId) {
      where.genreId = Number(query.genreId);
    }

    if (query.search && query.search.trim() !== '') {
      const searchTerm = query.search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { author: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        include: {
          genre: true,
          reviews: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data: books,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        genre: true,
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async update(id: number, dto: UpdateBookDto) {
    await this.findOne(id);

    if (dto.genreId) {
      const genre = await this.prisma.genre.findUnique({
        where: { id: dto.genreId },
      });
      if (!genre) {
        throw new NotFoundException(`Genre with ID ${dto.genreId} not found`);
      }
    }

    if (dto.isbn) {
      const existing = await this.prisma.book.findUnique({
        where: { isbn: dto.isbn },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Book with ISBN ${dto.isbn} already exists`);
      }
    }

    return this.prisma.book.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.author !== undefined && { author: dto.author }),
        ...(dto.isbn !== undefined && { isbn: dto.isbn }),
        ...(dto.publishedYear !== undefined && { publishedYear: dto.publishedYear }),
        ...(dto.totalCopies !== undefined && { copies: dto.totalCopies }),
        ...(dto.genreId !== undefined && { genreId: dto.genreId }),
      },
      include: {
        genre: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.book.delete({
      where: { id },
    });
  }
}
